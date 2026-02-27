// @ts-check

// ── Load .env.local before anything else ─────────────────────────────────────
const { existsSync } = require("fs");
const { resolve } = require("path");

const envPath = resolve(__dirname, ".env.local");
if (existsSync(envPath)) {
  require("fs")
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && !(key in process.env)) process.env[key] = val;
    });
  if (process.env.NODE_ENV !== "production") {
    console.log("[Env] ✅ Loaded .env.local");
  }
}

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const log = dev ? (...args) => console.log(...args) : () => {};
const logWarn = dev ? (...args) => console.warn(...args) : () => {};

// ── Redis client ──────────────────────────────────────────────────────────────
/** @type {import('ioredis').Redis | null} */
let redis = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  redis = new Redis(REDIS_URL, {
    // Upstash TLS requires this
    tls: REDIS_URL.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  redis.on("connect", () => log("[Redis] ✅ Connected"));
  redis.on("error", (err) => console.error("[Redis] ❌ Error:", err.message));
} else {
  logWarn(
    "[Redis] ⚠️  REDIS_URL not set — state persistence disabled.",
  );
}

/**
 * Redis key helpers
 * room:<roomId>:code     → latest editor content
 * room:<roomId>:language → selected language
 * room:<roomId>:meta     → room metadata (must exist to join)
 */
const redisKey = {
  code: (roomId) => `room:${roomId}:code`,
  language: (roomId) => `room:${roomId}:language`,
  timer: (roomId) => `room:${roomId}:timer`,
  meta: (roomId) => `room:${roomId}:meta`,
  chat: (roomId) => `room:${roomId}:chat`,
};

/**
 * Per-room debounce timers — we wait 500ms after the LAST keystroke
 * before writing to Redis. This prevents hitting Redis on every character.
 * Map<roomId, NodeJS.Timeout>
 */
const redisWriteTimers = new Map();
const REDIS_WRITE_DEBOUNCE_MS = 500;

/**
 * Schedule a debounced Redis write for the given room.
 * If another write is already pending it gets cancelled and rescheduled.
 */
function scheduleRedisCodeWrite(roomId, code, language) {
  if (!redis) return;

  if (redisWriteTimers.has(roomId)) {
    clearTimeout(redisWriteTimers.get(roomId));
  }

  const timer = setTimeout(async () => {
    redisWriteTimers.delete(roomId);
    try {
      const pipeline = redis.pipeline();
      pipeline.set(redisKey.code(roomId), code);
      if (language) pipeline.set(redisKey.language(roomId), language);
      await pipeline.exec();
      log(`[Redis] 💾 Saved code for room "${roomId}" (${code.length} chars)`);
    } catch (err) {
      console.error(
        `[Redis] ❌ Failed to save code for room "${roomId}":`,
        err.message,
      );
    }
  }, REDIS_WRITE_DEBOUNCE_MS);

  redisWriteTimers.set(roomId, timer);
}

/**
 * Fetch the latest code and language for a room from Redis.
 * Returns null values if Redis is unavailable or no data exists.
 */
async function fetchRoomState(roomId) {
  if (!redis) return { code: null, language: null, timer: null };
  try {
    const [code, language, timerStr] = await Promise.all([
      redis.get(redisKey.code(roomId)),
      redis.get(redisKey.language(roomId)),
      redis.get(redisKey.timer(roomId)),
    ]);
    const timer = timerStr ? JSON.parse(timerStr) : null;
    return { code, language, timer };
  } catch (err) {
    console.error(
      `[Redis] ❌ Failed to fetch room "${roomId}" state:`,
      err.message,
    );
    return { code: null, language: null, timer: null };
  }
}

// ── Next.js + Socket.io server ────────────────────────────────────────────────
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  /**
   * In-memory room store: roomId → { users: Map<socketId, { username, color, emoji? }>, organizerId: string | null }
   * Redis handles *code* persistence; this Map handles *user presence*.
   */
  const rooms = new Map();

  const USER_COLORS = [
    "#58a6ff",
    "#3fb950",
    "#bc8cff",
    "#f78166",
    "#ffa657",
    "#79c0ff",
    "#a5d6ff",
    "#d2a8ff",
  ];

  io.on("connection", (socket) => {
    log(`[Socket.io] ✅ Client connected: ${socket.id}`);

    // ── join-room ─────────────────────────────────────────────────────────────
    socket.on("join-room", async ({ roomId, username, emoji }) => {
      log(`[Socket.io] 👤 "${username}" (${socket.id}) joining room "${roomId}"`);

      // Check room exists (created via API)
      if (redis) {
        const metaExists = await redis.get(redisKey.meta(roomId));
        if (!metaExists) {
          socket.emit("join-error", { reason: "room_not_found" });
          log(`[Socket.io] ❌ Room "${roomId}" not found (no meta)`);
          return;
        }
      }

      // Add to presence store: room = { users: Map(), organizerId }
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          users: new Map(),
          organizerId: null,
        });
      }
      const room = rooms.get(roomId);
      const userCount = room.users.size;
      const color = USER_COLORS[userCount % USER_COLORS.length];
      const isOrganizer = userCount === 0;
      if (isOrganizer) room.organizerId = socket.id;
      room.users.set(socket.id, {
        username,
        color,
        emoji: emoji || undefined,
      });

      socket.join(roomId);

      const userList = [...room.users.entries()].map(([id, data]) => ({
        id,
        ...data,
        isOrganizer: id === room.organizerId,
      }));
      socket.emit("room-users", userList);

      socket.to(roomId).emit("user-joined", {
        id: socket.id,
        username,
        color,
        emoji: emoji || undefined,
        isOrganizer,
      });

      log(`[Socket.io] 📋 Room "${roomId}" — ${room.users.size} user(s): ${userList.map((u) => u.username).join(", ")}`);

      const { code, language, timer } = await fetchRoomState(roomId);

      if (code !== null) {
        log(`[Redis] 📤 Sending persisted state to "${username}" (${code.length} chars)`);
        socket.emit("initial-state", { code, language });
      } else {
        log(`[Redis] ℹ️  No persisted state for room "${roomId}"`);
      }

      if (timer) {
        socket.emit("timer:sync", timer);
      }

      if (redis) {
        try {
          const messagesStr = await redis.lrange(redisKey.chat(roomId), 0, 49);
          const messages = messagesStr.map((m) => JSON.parse(m)).reverse();
          socket.emit("chat-history", messages);
        } catch (err) {
          console.error(
            `[Redis] ❌ Failed to fetch chat history for room "${roomId}":`,
            err.message,
          );
        }
      }
    });

    // ── kick-user ─────────────────────────────────────────────────────────────
    socket.on("kick-user", ({ roomId, targetSocketId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.organizerId !== socket.id) return;
      if (targetSocketId === room.organizerId) return;
      if (!room.users.has(targetSocketId)) return;
      room.users.delete(targetSocketId);
      io.to(roomId).emit("user-left", { id: targetSocketId });
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit("kicked", {});
        targetSocket.leave(roomId);
      }
      log(`[Socket.io] 👢 Organizer kicked ${targetSocketId} from room "${roomId}"`);
    });

    // ── timer events ──────────────────────────────────────────────────────────
    socket.on("timer:start", async ({ roomId, duration, remaining }) => {
      log(`[Socket.io] ⏱️ Timer STARTED for room ${roomId}: ${remaining}s left`);
      const state = {
        isRunning: true,
        duration,
        remaining,
        lastUpdateAt: Date.now(),
      };
      if (redis) await redis.set(redisKey.timer(roomId), JSON.stringify(state));
      io.to(roomId).emit("timer:sync", state);
    });

    socket.on("timer:pause", async ({ roomId, duration, remaining }) => {
      log(`[Socket.io] ⏸️ Timer PAUSED for room ${roomId}: ${remaining}s left`);
      const state = {
        isRunning: false,
        duration,
        remaining,
        lastUpdateAt: Date.now(),
      };
      if (redis) await redis.set(redisKey.timer(roomId), JSON.stringify(state));
      io.to(roomId).emit("timer:sync", state);
    });

    socket.on("timer:reset", async ({ roomId, duration }) => {
      log(`[Socket.io] 🔄 Timer RESET for room ${roomId}: duration ${duration}s`);
      const state = {
        isRunning: false,
        duration,
        remaining: duration,
        lastUpdateAt: Date.now(),
      };
      if (redis) await redis.set(redisKey.timer(roomId), JSON.stringify(state));
      io.to(roomId).emit("timer:sync", state);
    });

    // ── code-change ───────────────────────────────────────────────────────────
    socket.on("code-change", ({ roomId, code, language }) => {
      // 1. Relay to peers immediately (sub-100ms latency target)
      socket.to(roomId).emit("code-change", { code, language });

      // 2. Debounced write to Redis (500ms after last keystroke)
      scheduleRedisCodeWrite(roomId, code, language);
    });

    // ── send-message ──────────────────────────────────────────────────────────
    socket.on("send-message", async (message) => {
      const { roomId } = message;
      socket.to(roomId).emit("receive-message", message);

      if (redis) {
        try {
          const key = redisKey.chat(roomId);
          await redis.lpush(key, JSON.stringify(message));
          await redis.ltrim(key, 0, 49);
        } catch (err) {
          console.error(
            `[Redis] ❌ Failed to save chat message for room "${roomId}":`,
            err.message,
          );
        }
      }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      log(`[Socket.io] ❌ Client disconnected: ${socket.id} (reason: ${reason})`);

      for (const [roomId, room] of rooms.entries()) {
        if (!room.users.has(socket.id)) continue;
        const { username } = room.users.get(socket.id);
        const wasOrganizer = room.organizerId === socket.id;
        room.users.delete(socket.id);
        if (wasOrganizer) room.organizerId = null;

        log(`[Socket.io] 🚪 "${username}" left room "${roomId}" (${room.users.size} remaining)`);

        io.to(roomId).emit("user-left", { id: socket.id });

        if (room.users.size === 0) {
          rooms.delete(roomId);
          log(`[Socket.io] 🗑  Presence cleared for room "${roomId}"`);
        }
        break;
      }
    });
  });

  httpServer.listen(port, () => {
    log(`\n🚀 SyncCode server ready: http://${hostname}:${port}`);
    log(`   Redis: ${REDIS_URL ? "✅ connected" : "⚠️  disabled"}`);
    log(`   Mode: ${dev ? "development" : "production"}\n`);
  });
});
