import { redis, redisKeys } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";

const INVITE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

/** GET /api/rooms/[roomId]/invites — returns pending invite emails for a room */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;

  if (!redis) {
    return NextResponse.json({ emails: [] });
  }

  try {
    // Return all emails, newest first (score = timestamp desc)
    const emails = await redis.zrevrange(
      redisKeys.pendingInvites(roomId),
      0,
      -1,
    );
    return NextResponse.json({ emails });
  } catch (err) {
    console.error("[API] Failed to fetch pending invites:", err);
    return NextResponse.json({ emails: [] });
  }
}

/** DELETE /api/rooms/[roomId]/invites?email=... — remove a specific invite */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params;
  const email = req.nextUrl.searchParams.get("email");

  if (!email || !redis) {
    return NextResponse.json({ ok: false });
  }

  try {
    await redis.zrem(redisKeys.pendingInvites(roomId), email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

export { INVITE_TTL_SECONDS };
