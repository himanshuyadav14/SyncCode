"use client";

import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  Mail,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";

interface InviteEmailModalProps {
  roomId: string;
  roomUrl: string;
  onClose: () => void;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function InviteEmailModal({
  roomId,
  roomUrl,
  onClose,
}: InviteEmailModalProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      setErrorMsg("Could not copy link");
    }
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSend = async () => {
    if (!email.trim()) return setErrorMsg("Please enter an email address.");
    if (!isValidEmail(email.trim()))
      return setErrorMsg("Please enter a valid email address.");

    setErrorMsg("");
    setStatus("sending");

    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), roomId, roomUrl }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send invitation.");
      }

      setStatus("sent");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to send invitation.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && status !== "sending") handleSend();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "440px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1.1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(79,156,249,0.1)",
                border: "1px solid rgba(79,156,249,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Mail size={17} color="var(--accent-blue)" strokeWidth={1.8} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Invite via Email
              </h2>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                }}
              >
                Room:{" "}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "var(--accent-blue)",
                  }}
                >
                  {roomId}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)")
            }
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Success state */}
        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "1rem 0 0.5rem" }}>
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background: "rgba(52,211,153,0.1)",
                border: "1px solid rgba(52,211,153,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 0.75rem",
              }}
            >
              <Check size={24} color="var(--accent-green)" strokeWidth={2.5} />
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "0.35rem",
              }}
            >
              Invitation Sent!
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              An invite with the room link was sent to{" "}
              <span style={{ color: "var(--text-secondary)" }}>{email}</span>.
              They can click it to join instantly.
            </p>
            <button
              onClick={onClose}
              style={{
                marginTop: "1.25rem",
                padding: "8px 20px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
                color: "var(--text-secondary)",
                fontSize: "0.82rem",
                fontFamily: "inherit",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Room link + Copy */}
            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-muted)",
                borderRadius: "8px",
                padding: "0.6rem 0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                marginBottom: "1rem",
              }}
            >
              <Link2 size={12} color="var(--text-muted)" strokeWidth={1.8} />
              <p
                style={{
                  flex: 1,
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  fontFamily: "'JetBrains Mono', monospace",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {roomUrl}
              </p>
              <button
                type="button"
                onClick={copyRoomLink}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "4px 10px",
                  background: linkCopied
                    ? "rgba(52,211,153,0.15)"
                    : "rgba(79,156,249,0.12)",
                  border: `1px solid ${linkCopied ? "rgba(52,211,153,0.35)" : "rgba(79,156,249,0.25)"}`,
                  borderRadius: "6px",
                  color: linkCopied
                    ? "var(--accent-green)"
                    : "var(--accent-blue)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {linkCopied ? (
                  <>
                    <Check size={12} strokeWidth={2.5} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={12} strokeWidth={1.8} />
                    Copy link
                  </>
                )}
              </button>
            </div>

            {/* Email input */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem",
                  letterSpacing: "0.03em",
                }}
              >
                Recipient Email
              </label>
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg("");
                  if (status === "error") setStatus("idle");
                }}
                onKeyDown={handleKeyDown}
                placeholder="friend@example.com"
                disabled={status === "sending"}
                style={{
                  width: "100%",
                  background: "#0a0a0c",
                  border: `1px solid ${errorMsg ? "rgba(248,113,113,0.4)" : "var(--border-default)"}`,
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  padding: "0.65rem 0.85rem",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.18s",
                  opacity: status === "sending" ? 0.6 : 1,
                }}
                onFocus={(e) => {
                  if (!errorMsg)
                    (e.target as HTMLInputElement).style.borderColor =
                      "var(--accent-blue)";
                }}
                onBlur={(e) => {
                  if (!errorMsg)
                    (e.target as HTMLInputElement).style.borderColor =
                      "var(--border-default)";
                }}
              />
            </div>

            {/* Error */}
            {errorMsg && (
              <div
                className="animate-fade-in"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(248,113,113,0.07)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: "7px",
                  marginBottom: "0.75rem",
                  fontSize: "0.78rem",
                  color: "var(--accent-red)",
                }}
              >
                <AlertCircle size={13} strokeWidth={2} />
                {errorMsg}
              </div>
            )}

            {/* Info note */}
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                lineHeight: 1.5,
                marginBottom: "1rem",
              }}
            >
              The recipient will receive an email with the room link. They can
              click it to join immediately — no signup required.
            </p>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={onClose}
                disabled={status === "sending"}
                style={{
                  padding: "8px 16px",
                  background: "var(--bg-hover)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "var(--text-secondary)",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={status === "sending" || !email.trim()}
                style={{
                  padding: "8px 20px",
                  background:
                    status === "sending"
                      ? "rgba(79,156,249,0.15)"
                      : "var(--accent-blue)",
                  border: "1px solid transparent",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor:
                    status === "sending" || !email.trim()
                      ? "not-allowed"
                      : "pointer",
                  opacity: !email.trim() ? 0.5 : 1,
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onMouseEnter={(e) => {
                  if (!email.trim() || status === "sending") return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#3b82f6";
                }}
                onMouseLeave={(e) => {
                  if (!email.trim() || status === "sending") return;
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--accent-blue)";
                }}
              >
                {status === "sending" ? (
                  <>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                      }}
                    />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={13} strokeWidth={2} />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
