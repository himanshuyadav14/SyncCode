import { redis, redisKeys } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

/** POST /api/rooms/create — create a new room (store meta in Redis), return roomId */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const roomName = typeof body.roomName === "string" ? body.roomName.trim() : "";
  const name = roomName || "Unnamed room";

  if (!redis) {
    return NextResponse.json(
      { error: "Room creation unavailable (Redis not configured)" },
      { status: 503 },
    );
  }

  let roomId = uuidv4().slice(0, 8).toLowerCase();
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    const metaKey = redisKeys.meta(roomId);
    const exists = await redis.get(metaKey);
    if (!exists) break;
    roomId = uuidv4().slice(0, 8).toLowerCase();
    attempts++;
  }

  const meta = JSON.stringify({
    name: name.slice(0, 64),
    createdAt: Date.now(),
  });

  try {
    await redis.set(redisKeys.meta(roomId), meta);
    return NextResponse.json({ roomId });
  } catch (err) {
    console.error("[API] Failed to create room:", err);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 },
    );
  }
}
