import { redis, redisKeys } from "@/lib/redis";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const PENDING_INVITE_TTL = 60 * 60 * 24; // 24 hours

/** Store the invited email in Redis as a pending invite */
async function storePendingInvite(roomId: string, email: string) {
  if (!redis) return;
  const key = redisKeys.pendingInvites(roomId);
  const score = Date.now();
  await redis.zadd(key, score, email);
  await redis.expire(key, PENDING_INVITE_TTL);
}

export async function POST(req: NextRequest) {
  const { email, roomId, roomUrl } = await req.json();

  if (!email || !roomUrl) {
    return NextResponse.json(
      { error: "Missing email or roomUrl" },
      { status: 400 },
    );
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (roomId) await storePendingInvite(roomId, email);
    return NextResponse.json(
      { ok: false, fallback: true, error: "SMTP not configured" },
      { status: 200 },
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: { user, pass },
  });

  const fromName = process.env.SMTP_FROM_NAME ?? "SyncCode";
  const fromEmail = process.env.SMTP_FROM_EMAIL ?? user;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SyncCode Invitation</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111113;border:1px solid #1f1f23;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:#000;padding:24px 32px;border-bottom:1px solid #1f1f23;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:36px;height:36px;background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid rgba(79,156,249,0.25);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:18px;">⟨/⟩</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="font-size:1.1rem;font-weight:800;color:#fafafa;letter-spacing:-0.03em;">SyncCode</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 8px;font-size:1.3rem;font-weight:700;color:#fafafa;letter-spacing:-0.02em;">
              You're invited to collaborate! 🚀
            </h1>
            <p style="margin:0 0 24px;font-size:0.9rem;color:#a1a1aa;line-height:1.6;">
              Someone invited you to join a live coding session on SyncCode — a real-time collaborative code editor.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #1f1f23;border-radius:10px;margin-bottom:24px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 4px;font-size:0.7rem;font-weight:700;color:#52525b;text-transform:uppercase;letter-spacing:0.1em;">Room ID</p>
                  <p style="margin:0;font-size:0.95rem;font-family:'Courier New',monospace;color:#4f9cf9;font-weight:600;letter-spacing:0.06em;">${roomId}</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="border-radius:9px;background:#4f9cf9;">
                  <a href="${roomUrl}" target="_blank"
                     style="display:inline-block;padding:12px 28px;color:#fff;font-size:0.9rem;font-weight:600;text-decoration:none;letter-spacing:-0.01em;border-radius:9px;">
                    Join Coding Session →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:20px 0 0;font-size:0.75rem;color:#3f3f46;line-height:1.5;">
              Or copy this link into your browser:<br/>
              <span style="color:#52525b;font-family:'Courier New',monospace;font-size:0.72rem;">${roomUrl}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #1f1f23;background:#0a0a0c;">
            <p style="margin:0;font-size:0.7rem;color:#3f3f46;">
              Built with Next.js · Socket.io · Monaco · Redis
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

  const subject = `Join my SyncCode session — Room ${roomId}`;
  const text = `You've been invited to a SyncCode collaborative coding session!\n\nRoom: ${roomId}\nJoin here: ${roomUrl}\n\nNo signup required — just click the link!`;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: email,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error("[Invite] SMTP error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to send email.",
      },
      { status: 502 },
    );
  }

  await storePendingInvite(roomId, email);
  return NextResponse.json({ ok: true });
}
