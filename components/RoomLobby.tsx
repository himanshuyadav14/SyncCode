"use client";

import { DEFAULT_EMOJI, EMOJI_OPTIONS } from "@/lib/emojis";
import { Code2, RefreshCw, Users, Wifi } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface RoomLobbyProps {
  roomId: string;
  onJoin: (username: string, emoji: string) => void;
  onRoomError?: () => void;
}

export default function RoomLobby({
  roomId,
  onJoin,
  onRoomError,
}: RoomLobbyProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoJoining, setAutoJoining] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchRoomMeta = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
      if (res.status === 404) {
        onRoomError?.();
        return;
      }
      if (!res.ok) {
        onRoomError?.();
        return;
      }
      const data = await res.json();
      setRoomName(data.name ?? "Unnamed room");
    } catch {
      onRoomError?.();
    } finally {
      setRoomLoading(false);
    }
  }, [roomId, onRoomError]);

  useEffect(() => {
    const stored = sessionStorage.getItem("synccode-username");
    const storedEmoji = sessionStorage.getItem("synccode-emoji");
    const directJoin = sessionStorage.getItem("synccode-direct-join");

    if (stored) setName(stored);
    if (storedEmoji && EMOJI_OPTIONS.includes(storedEmoji)) setEmoji(storedEmoji);

    if (directJoin === "true" && stored) {
      sessionStorage.removeItem("synccode-direct-join");
      setAutoJoining(true);
      (async () => {
        try {
          const res = await fetch(`/api/rooms/${roomId}`, { cache: "no-store" });
          if (res.status === 404 || !res.ok) {
            onRoomError?.();
            return;
          }
          await res.json();
          onJoin(stored, storedEmoji || DEFAULT_EMOJI);
        } catch {
          onRoomError?.();
        }
      })();
      return;
    }

    fetchRoomMeta();
    setTimeout(() => inputRef.current?.focus(), 80);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter your display name.");
    if (trimmed.length < 2)
      return setError("Name must be at least 2 characters.");
    if (trimmed.length > 32)
      return setError("Name is too long (max 32 chars).");
    sessionStorage.setItem("synccode-username", trimmed);
    sessionStorage.setItem("synccode-emoji", emoji);
    onJoin(trimmed, emoji);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJoin();
    if (error) setError("");
  };

  // Auto-joining from home page → render nothing (avoid lobby flash)
  if (autoJoining)
    return <div style={{ background: "#000", minHeight: "100vh" }} />;

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          pointerEvents: "none",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(79,156,249,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.55rem",
          marginBottom: "2.5rem",
          userSelect: "none",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            border: "1px solid rgba(79,156,249,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxShadow: "0 0 20px rgba(79,156,249,0.2)",
          }}
        >
          <Code2 size={20} color="#4f9cf9" strokeWidth={2.2} />
          <RefreshCw
            size={9}
            color="#34d399"
            strokeWidth={3}
            style={{ position: "absolute", bottom: "5px", right: "4px" }}
          />
        </div>
        <span
          style={{
            fontWeight: 800,
            fontSize: "1.3rem",
            letterSpacing: "-0.04em",
            background: "linear-gradient(135deg, #f4f4f5 50%, #71717a)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SyncCode
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          background: "#0d0d0f",
          border: "1px solid #1f1f23",
          borderRadius: "18px",
          padding: "2rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Room info banner */}
        <div
          style={{
            background: "rgba(79,156,249,0.06)",
            border: "1px solid rgba(79,156,249,0.15)",
            borderRadius: "10px",
            padding: "0.85rem 1rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "9px",
              background: "rgba(79,156,249,0.1)",
              border: "1px solid rgba(79,156,249,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={17} color="#4f9cf9" strokeWidth={1.8} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              You're invited to room
            </p>
            <p
              style={{
                fontSize: "0.9rem",
                fontFamily: roomName ? "inherit" : "'JetBrains Mono', monospace",
                fontWeight: 700,
                color: "#4f9cf9",
                letterSpacing: "0.06em",
                marginTop: "1px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {roomLoading ? "Loading…" : (roomName ?? roomId)}
            </p>
          </div>
          {/* Live indicator */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
            }}
          >
            <Wifi size={11} color="var(--accent-green)" strokeWidth={2} />
            <span
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                color: "var(--accent-green)",
                letterSpacing: "0.07em",
              }}
            >
              LIVE
            </span>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "1.2rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: "0.35rem",
          }}
        >
          Ready to join?
        </h1>
        <p
          style={{
            fontSize: "0.83rem",
            color: "var(--text-muted)",
            lineHeight: 1.55,
            marginBottom: "1rem",
          }}
        >
          Enter your display name and pick an avatar. Others in the room will
          see them.
        </p>

        {/* Emoji picker */}
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.73rem",
              fontWeight: 700,
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              marginBottom: "0.4rem",
            }}
          >
            Avatar
          </label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.35rem",
            }}
          >
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  width: "36px",
                  height: "36px",
                  fontSize: "1.1rem",
                  border: emoji === e ? "2px solid var(--accent-blue)" : "1px solid #1f1f23",
                  borderRadius: "8px",
                  background: emoji === e ? "rgba(79,156,249,0.12)" : "#080809",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: error ? "0.5rem" : "1.25rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.73rem",
              fontWeight: 700,
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
              marginBottom: "0.4rem",
            }}
          >
            Display Name
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            maxLength={32}
            placeholder="e.g. Himanshu"
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={handleKey}
            style={{
              width: "100%",
              background: "#080809",
              border: `1px solid ${error ? "rgba(248,113,113,0.4)" : "#1f1f23"}`,
              borderRadius: "10px",
              color: "var(--text-primary)",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              padding: "0.7rem 1rem",
              outline: "none",
              transition: "border-color 0.18s",
            }}
            onFocus={(e) => {
              if (!error)
                (e.target as HTMLInputElement).style.borderColor =
                  "rgba(79,156,249,0.5)";
            }}
            onBlur={(e) => {
              if (!error)
                (e.target as HTMLInputElement).style.borderColor = "#1f1f23";
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <p
            className="animate-fade-in"
            style={{
              fontSize: "0.75rem",
              color: "var(--accent-red)",
              marginBottom: "1rem",
              paddingLeft: "0.25rem",
            }}
          >
            {error}
          </p>
        )}

        {/* Join button */}
        <button
          onClick={handleJoin}
          disabled={!name.trim() || roomLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            background:
              name.trim() && !roomLoading
                ? "var(--accent-blue)"
                : "rgba(79,156,249,0.15)",
            border: "none",
            borderRadius: "10px",
            color:
              name.trim() && !roomLoading ? "#fff" : "rgba(79,156,249,0.4)",
            fontSize: "0.92rem",
            fontWeight: 700,
            fontFamily: "inherit",
            cursor: name.trim() && !roomLoading ? "pointer" : "not-allowed",
            transition: "all 0.18s",
            letterSpacing: "-0.01em",
          }}
          onMouseEnter={(e) => {
            if (name.trim() && !roomLoading)
              (e.currentTarget as HTMLButtonElement).style.background =
                "#3b82f6";
          }}
          onMouseLeave={(e) => {
            if (name.trim() && !roomLoading)
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--accent-blue)";
          }}
        >
          Join Session →
        </button>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            marginTop: "1rem",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
          }}
        >
          No account needed · Real-time collaboration
        </p>
      </div>

      {/* Bottom credit */}
      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "0.7rem",
          color: "#333337",
          position: "relative",
        }}
      >
        Built with Next.js · Socket.io · Monaco · Redis
      </p>
    </div>
  );
}
