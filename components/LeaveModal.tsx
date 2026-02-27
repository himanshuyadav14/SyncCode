"use client";

import { LogOut, X } from "lucide-react";

interface LeaveModalProps {
  roomId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LeaveModal({
  roomId,
  onConfirm,
  onCancel,
}: LeaveModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="modal-card" style={{ maxWidth: "380px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <LogOut size={17} color="var(--accent-red)" strokeWidth={2} />
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
                Leave Room?
              </h2>
              <p
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "1px",
                }}
              >
                Room ID:{" "}
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
            onClick={onCancel}
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

        {/* Body */}
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "1.25rem",
          }}
        >
          Are you sure you want to leave this room? Your connection will be
          closed. You can rejoin anytime using the same room link.
        </p>

        {/* Actions */}
        <div
          style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}
        >
          <button
            onClick={onCancel}
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-strong)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "var(--border-default)";
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-secondary)";
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "8px 20px",
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: "8px",
              color: "var(--accent-red)",
              fontSize: "0.82rem",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(248,113,113,0.2)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(248,113,113,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(248,113,113,0.12)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(248,113,113,0.3)";
            }}
          >
            <LogOut size={13} strokeWidth={2} />
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
