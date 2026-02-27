"use client";

export default function RoomLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: "3px solid var(--border-muted, #27272a)",
          borderTopColor: "var(--accent-blue, #4f9cf9)",
          borderRadius: "50%",
          animation: "synccode-spin 0.85s linear infinite",
        }}
      />
      <p
        style={{
          color: "var(--text-muted, #71717a)",
          fontSize: "0.9375rem",
          fontWeight: 500,
          margin: 0,
        }}
      >
        Preparing your room…
      </p>
      <style>{`@keyframes synccode-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
