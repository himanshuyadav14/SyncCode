import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redisClient: Redis | null | undefined;
}

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  // Reuse across hot-reloads in dev
  if (!global._redisClient) {
    global._redisClient = new Redis(url, {
      tls: url.startsWith("rediss://") ? {} : undefined,
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });
    global._redisClient.on("error", (e) =>
      console.error("[Redis API client]", e.message),
    );
  }
  return global._redisClient;
}

export const redis = getRedisClient();

export const redisKeys = {
  code: (roomId: string) => `room:${roomId}:code`,
  language: (roomId: string) => `room:${roomId}:language`,
  timer: (roomId: string) => `room:${roomId}:timer`,
  /** Sorted set: member = email, score = invitedAt timestamp */
  pendingInvites: (roomId: string) => `room:${roomId}:pending_invites`,
  /** Room metadata: { name: string, createdAt?: number } — room must exist to join */
  meta: (roomId: string) => `room:${roomId}:meta`,
};
