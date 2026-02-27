import { redis, redisKeys } from "@/lib/redis";
import { isValidRoomId } from "@/lib/roomId";
import { NextRequest, NextResponse } from "next/server";

/** GET /api/rooms/[roomId] — return room meta (name) or 404 if room does not exist */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  if (!isValidRoomId(roomId)) {
    return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
  }

  if (!redis) {
    return NextResponse.json(
      { error: "Service unavailable" },
      { status: 503 },
    );
  }

  try {
    const raw = await redis.get(redisKeys.meta(roomId));
    if (!raw) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const meta = JSON.parse(raw) as { name?: string; createdAt?: number };
    return NextResponse.json({
      roomId,
      name: meta.name ?? "Unnamed room",
      createdAt: meta.createdAt ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
}
