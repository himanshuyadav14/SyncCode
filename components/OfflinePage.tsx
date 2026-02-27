"use client";

import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "var(--bg-header, #18181b)",
          border: "1px solid var(--border-muted, #27272a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <WifiOff
          size={40}
          style={{ color: "var(--text-muted, #71717a)" }}
          aria-hidden
        />
      </div>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          margin: 0,
        }}
      >
        You’re offline
      </h1>
      <p
        style={{
          fontSize: "0.9375rem",
          color: "var(--text-muted, #71717a)",
          margin: 0,
          maxWidth: 320,
          lineHeight: 1.5,
        }}
      >
        Check your internet connection and try again. SyncCode needs network access to sync your room.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          marginTop: 8,
          padding: "10px 20px",
          fontSize: "0.875rem",
          fontWeight: 600,
          color: "#fff",
          background: "var(--accent-blue, #4f9cf9)",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
