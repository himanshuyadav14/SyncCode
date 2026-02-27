"use client";

import { DEFAULT_EMOJI, EMOJI_OPTIONS } from "@/lib/emojis";
import {
  ArrowRight,
  Code2,
  Hash,
  RefreshCw,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-100ms sync",
    desc: "WebSocket-powered real-time collaboration with Socket.io",
  },
  {
    icon: Users,
    title: "Room-based sessions",
    desc: "Share a link and your team joins instantly — no accounts needed",
  },
  {
    icon: Shield,
    title: "State persistence",
    desc: "Redis-backed sessions so late joiners see the full document",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [tab, setTab] = useState<"join" | "create">("create");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("synccode-username");
    const storedEmoji = sessionStorage.getItem("synccode-emoji");
    if (stored) setUsername(stored);
    if (storedEmoji && EMOJI_OPTIONS.includes(storedEmoji)) setEmoji(storedEmoji);
    usernameRef.current?.focus();
  }, []);

  const saveUsername = (val: string) => {
    setUsername(val);
    if (val.trim()) sessionStorage.setItem("synccode-username", val.trim());
  };

  const handleCreate = async () => {
    const name = username.trim();
    if (!name) return setError("Please enter your display name.");
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: roomName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create room");
        return;
      }
      const data = await res.json();
      const newRoomId = data.roomId;
      if (!newRoomId) {
        setError("Invalid response from server");
        return;
      }
      sessionStorage.setItem("synccode-username", name);
      sessionStorage.setItem("synccode-emoji", emoji);
      sessionStorage.setItem("synccode-direct-join", "true");
      router.push(`/room/${newRoomId}`);
    } catch {
      setError("Failed to create room");
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const name = username.trim();
    const rid = roomId.trim().toLowerCase();
    if (!name) return setError("Please enter your display name.");
    if (!rid) return setError("Please enter a room ID to join.");
    setError("");
    sessionStorage.setItem("synccode-username", name);
    sessionStorage.setItem("synccode-emoji", emoji);
    sessionStorage.setItem("synccode-direct-join", "true");
    router.push(`/room/${rid}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(var(--border-muted) 1px, transparent 1px), linear-gradient(90deg, var(--border-muted) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      {/* Radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(79,156,249,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Main card */}
      <div
        className="animate-fade-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            marginBottom: "2rem",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "11px",
              background: "#111",
              border: "1px solid var(--border-strong)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: "0 4px 20px rgba(79,156,249,0.12)",
            }}
          >
            <Code2 size={20} color="#4f9cf9" strokeWidth={2} />
            <RefreshCw
              size={9}
              color="#34d399"
              strokeWidth={3}
              style={{ position: "absolute", bottom: "4px", right: "4px" }}
            />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                background: "linear-gradient(135deg, #fafafa 50%, #71717a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.1,
              }}
            >
              SyncCode
            </h1>
            <p
              style={{
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                fontWeight: 500,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Real-time collaboration
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            {(["create", "join"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                style={{
                  padding: "0.85rem 1rem",
                  background: tab === t ? "var(--bg-active)" : "transparent",
                  border: "none",
                  borderBottom:
                    tab === t
                      ? "2px solid var(--accent-blue)"
                      : "2px solid transparent",
                  color:
                    tab === t ? "var(--text-primary)" : "var(--text-muted)",
                  fontSize: "0.85rem",
                  fontWeight: tab === t ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.18s",
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}
              >
                {t === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div style={{ padding: "1.5rem" }}>
            {/* Display name */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem",
                  letterSpacing: "0.03em",
                }}
              >
                Display Name
              </label>
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => saveUsername(e.target.value)}
                placeholder="e.g., alice"
                maxLength={32}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    tab === "create" ? handleCreate() : handleJoin();
                }}
                style={{
                  width: "100%",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  fontSize: "0.9rem",
                  padding: "0.6rem 0.85rem",
                  outline: "none",
                  fontFamily: "inherit",
                  transition: "border-color 0.18s",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--accent-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor =
                    "var(--border-default)";
                }}
              />
            </div>

            {/* Room name (create tab only) */}
            {tab === "create" && (
              <div style={{ marginBottom: "1rem" }} className="animate-fade-in">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.4rem",
                    letterSpacing: "0.03em",
                  }}
                >
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Team Standup"
                  maxLength={64}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                  }}
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    padding: "0.6rem 0.85rem",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.18s",
                  }}
                />
              </div>
            )}

            {/* Avatar (emoji) */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "0.4rem",
                  letterSpacing: "0.03em",
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
                      width: "34px",
                      height: "34px",
                      fontSize: "1rem",
                      border:
                        emoji === e
                          ? "2px solid var(--accent-blue)"
                          : "1px solid var(--border-default)",
                      borderRadius: "8px",
                      background:
                        emoji === e
                          ? "rgba(79,156,249,0.12)"
                          : "var(--bg-primary)",
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

            {/* Room ID (join tab only) */}
            {tab === "join" && (
              <div style={{ marginBottom: "1rem" }} className="animate-fade-in">
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.4rem",
                    letterSpacing: "0.03em",
                  }}
                >
                  Room ID
                </label>
                <div style={{ position: "relative" }}>
                  <Hash
                    size={14}
                    color="var(--text-muted)"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toLowerCase())}
                    placeholder="e.g., a1b2c3d4"
                    maxLength={32}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    style={{
                      width: "100%",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      fontSize: "0.88rem",
                      padding: "0.6rem 0.85rem 0.6rem 2rem",
                      outline: "none",
                      fontFamily: "'JetBrains Mono', monospace",
                      transition: "border-color 0.18s",
                      letterSpacing: "0.05em",
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--accent-blue)";
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLInputElement).style.borderColor =
                        "var(--border-default)";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p
                className="animate-fade-in"
                style={{
                  fontSize: "0.78rem",
                  color: "var(--accent-red)",
                  marginBottom: "0.75rem",
                  padding: "0.5rem 0.75rem",
                  background: "rgba(248,113,113,0.08)",
                  borderRadius: "7px",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                {error}
              </p>
            )}

            {/* CTA Button */}
            <button
              id={tab === "create" ? "create-room-btn" : "join-room-btn"}
              onClick={tab === "create" ? handleCreate : handleJoin}
              disabled={tab === "create" && creating}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                background: "var(--accent-blue)",
                color: "#fff",
                border: "none",
                borderRadius: "9px",
                padding: "0.75rem 1rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.18s",
                letterSpacing: "-0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#3b82f6";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(-1px)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  "0 4px 16px rgba(79,156,249,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--accent-blue)";
                (e.currentTarget as HTMLButtonElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {tab === "create" ? "Create New Room" : "Join Room"}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginTop: "1.5rem",
          }}
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.65rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "10px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid var(--border-muted)",
              }}
            >
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={13} color="var(--accent-blue)" strokeWidth={2} />
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "1px",
                  }}
                >
                  {title}
                </p>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.4,
                  }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            marginTop: "1.5rem",
            letterSpacing: "0.02em",
          }}
        >
          Built with Next.js · Socket.io · Monaco · Redis
        </p>
      </div>
    </div>
  );
}
