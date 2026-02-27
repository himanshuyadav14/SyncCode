"use client";

import { AlertCircle, Code2, RefreshCw } from "lucide-react";
import Link from "next/link";

export type RoomErrorKind = "invalid_id" | "room_not_found" | "kicked";

const MESSAGES: Record<RoomErrorKind, string> = {
  invalid_id: "Invalid room ID. Please check the link or use a valid room code.",
  room_not_found: "This room doesn't exist or the link is wrong.",
  kicked: "You were removed from the room by the organizer.",
};

interface RoomErrorProps {
  kind: RoomErrorKind;
}

export default function RoomError({ kind }: RoomErrorProps) {
  const message = MESSAGES[kind];

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
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          position: "relative",
          background: "#0d0d0f",
          border: "1px solid rgba(248,113,113,0.2)",
          borderRadius: "18px",
          padding: "2rem",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle size={22} color="var(--accent-red)" strokeWidth={2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.15rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {kind === "kicked" ? "Removed from room" : "Room error"}
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                marginTop: "2px",
              }}
            >
              {message}
            </p>
          </div>
        </div>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem 1rem",
            background: "var(--accent-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "0.9rem",
            fontWeight: 600,
            fontFamily: "inherit",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.18s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#3b82f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--accent-blue)";
          }}
        >
          <Code2 size={16} />
          <RefreshCw size={14} />
          Back to SyncCode
        </Link>
      </div>
    </div>
  );
}
