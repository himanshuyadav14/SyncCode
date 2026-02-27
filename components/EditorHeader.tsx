"use client";

import { formatTime } from "@/hooks/useTimer";
import {
    Check,
    ChevronDown,
    Code2,
    Copy,
    LogOut,
    Mail,
    PanelLeft,
    PanelLeftClose,
    Pause,
    Play,
    RefreshCw,
    RotateCcw,
    Timer,
    Video,
    VideoOff,
    Wifi,
    WifiOff,
} from "lucide-react";
import { useCallback, useState } from "react";
import InviteEmailModal from "./InviteEmailModal";

interface LanguageOption {
  label: string;
  value: string;
}

interface EditorHeaderProps {
  roomId: string;
  language: string;
  onLanguageChange: (lang: string) => void;
  languageOptions: LanguageOption[];
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isConnected?: boolean;
  onLeaveRoom: () => void;
  onRunCode: () => void;
  isExecuting?: boolean;
  timerRunning?: boolean;
  timerRemaining?: number;
  onToggleTimer?: () => void;
  onResetTimer?: () => void;
  isVideoOpen?: boolean;
  isVideoMinimized?: boolean;
  onToggleVideo?: () => void;
  onMaximizeVideo?: () => void;
}

export default function EditorHeader({
  roomId,
  language,
  onLanguageChange,
  languageOptions,
  sidebarOpen,
  onToggleSidebar,
  isConnected = false,
  onLeaveRoom,
  onRunCode,
  isExecuting = false,
  timerRunning = false,
  timerRemaining = 2700,
  onToggleTimer,
  onResetTimer,
  isVideoOpen = false,
  isVideoMinimized = false,
  onToggleVideo,
  onMaximizeVideo,
}: EditorHeaderProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const roomUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `http://localhost:3000/room/${roomId}`;

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }, [roomId]);

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(roomUrl);
    setCopiedLink(true);
    setShowToast(true);
    setTimeout(() => {
      setCopiedLink(false);
      setShowToast(false);
    }, 2500);
  }, [roomUrl]);

  return (
    <>
      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showInviteModal && (
        <InviteEmailModal
          roomId={roomId}
          roomUrl={roomUrl}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          background: "var(--bg-header)",
          borderBottom: "1px solid var(--border-muted)",
          padding: "0 1rem",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexShrink: 0,
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* ── LEFT ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Sidebar toggle */}
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              transition: "color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-primary)";
              (e.currentTarget as HTMLButtonElement).style.background =
                "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--text-muted)";
              (e.currentTarget as HTMLButtonElement).style.background = "none";
            }}
          >
            {sidebarOpen ? (
              <PanelLeftClose size={17} strokeWidth={1.8} />
            ) : (
              <PanelLeft size={17} strokeWidth={1.8} />
            )}
          </button>

          {/* Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              userSelect: "none",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                border: "1px solid rgba(79,156,249,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
                boxShadow: "0 0 10px rgba(79,156,249,0.15)",
              }}
            >
              <Code2 size={15} color="#4f9cf9" strokeWidth={2.2} />
              <RefreshCw
                size={7}
                color="#34d399"
                strokeWidth={3}
                style={{ position: "absolute", bottom: "4px", right: "3px" }}
              />
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                letterSpacing: "-0.03em",
                background: "linear-gradient(135deg, #f4f4f5 60%, #71717a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              SyncCode
            </span>
          </div>
        </div>

        {/* ── CENTER ───────────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {/* Interview Timer */}
          <div
            className="tour-timer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "rgba(255,255,255,0.03)",
              padding: "3px 8px",
              borderRadius: "6px",
              border: "1px solid var(--border-muted)",
            }}
          >
            <Timer
              size={13}
              color={timerRunning ? "var(--accent-green)" : "var(--text-muted)"}
            />
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: timerRunning
                  ? "var(--accent-green)"
                  : "var(--text-primary)",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.05em",
                width: "42px",
                textAlign: "center",
              }}
            >
              {formatTime(timerRemaining)}
            </span>
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                onClick={onToggleTimer}
                title={timerRunning ? "Pause Timer" : "Start Timer"}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "3px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "none";
                }}
              >
                {timerRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                onClick={onResetTimer}
                title="Reset Timer"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "3px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--text-muted)";
                  e.currentTarget.style.background = "none";
                }}
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Run Code Button */}
          <button
            className="tour-run-code"
            onClick={onRunCode}
            disabled={isExecuting}
            title="Run Code"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: isExecuting
                ? "rgba(52,211,153,0.3)"
                : "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: "6px",
              color: "var(--accent-green)",
              fontSize: "0.8rem",
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: isExecuting ? "not-allowed" : "pointer",
              padding: "5px 12px",
              transition: "all 0.18s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => {
              if (!isExecuting) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(52,211,153,0.25)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(52,211,153,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isExecuting) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(52,211,153,0.15)";
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(52,211,153,0.3)";
              }
            }}
          >
            {isExecuting ? (
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  border: "2px solid rgba(52,211,153,0.3)",
                  borderTopColor: "var(--accent-green)",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <Play
                size={13}
                strokeWidth={2}
                style={{ fill: "currentColor" }}
              />
            )}
            <span>{isExecuting ? "Running" : "Run Code"}</span>
          </button>

          {/* Video Call Button: Join / Show Video (when minimized) / Leave Call */}
          {onToggleVideo && (
            <button
              onClick={() => {
                if (isVideoOpen && isVideoMinimized && onMaximizeVideo) {
                  onMaximizeVideo();
                } else {
                  onToggleVideo();
                }
              }}
              title={
                !isVideoOpen
                  ? "Join call"
                  : isVideoMinimized
                    ? "Show video panel"
                    : "Leave call"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background:
                  isVideoOpen && !isVideoMinimized
                    ? "rgba(248,113,113,0.18)"
                    : "rgba(79,156,249,0.1)",
                border: `1px solid ${
                  isVideoOpen && !isVideoMinimized
                    ? "rgba(248,113,113,0.4)"
                    : "rgba(79,156,249,0.3)"
                }`,
                borderRadius: "6px",
                color:
                  isVideoOpen && !isVideoMinimized
                    ? "var(--accent-red)"
                    : "var(--accent-blue)",
                fontSize: "0.8rem",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                padding: "5px 12px",
                transition: "all 0.18s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                if (isVideoOpen && !isVideoMinimized) {
                  btn.style.background = "rgba(248,113,113,0.25)";
                  btn.style.borderColor = "rgba(248,113,113,0.5)";
                } else {
                  btn.style.background = "rgba(79,156,249,0.25)";
                  btn.style.borderColor = "rgba(79,156,249,0.4)";
                }
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                if (isVideoOpen && !isVideoMinimized) {
                  btn.style.background = "rgba(248,113,113,0.18)";
                  btn.style.borderColor = "rgba(248,113,113,0.4)";
                } else {
                  btn.style.background = "rgba(79,156,249,0.1)";
                  btn.style.borderColor = "rgba(79,156,249,0.3)";
                }
              }}
            >
              {isVideoOpen ? (
                <Video size={13} strokeWidth={2} />
              ) : (
                <VideoOff size={13} strokeWidth={2} />
              )}
              <span>
                {!isVideoOpen
                  ? "Join Call"
                  : isVideoMinimized
                    ? "Show Video"
                    : "Leave Call"}
              </span>
            </button>
          )}
        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────── */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {/* Room ID */}
          <button
            onClick={copyRoomId}
            title="Click to copy room ID"
            style={{
              background: "rgba(79,156,249,0.07)",
              border: "1px solid rgba(79,156,249,0.15)",
              borderRadius: "6px",
              color: copiedId ? "var(--accent-green)" : "var(--accent-blue)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "4px 10px",
              fontSize: "0.78rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              transition: "all 0.18s",
              letterSpacing: "0.04em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(79,156,249,0.12)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(79,156,249,0.07)";
            }}
          >
            {copiedId ? (
              <Check size={11} strokeWidth={2.5} />
            ) : (
              <Copy size={11} strokeWidth={1.8} />
            )}
            {roomId}
          </button>

          {/* Single Invite button → opens modal with copy link + email */}
          <HeaderButton
            onClick={() => setShowInviteModal(true)}
            title="Invite – copy link or send via email"
            className="tour-invite"
          >
            <Mail size={13} strokeWidth={1.8} />
            <span>Invite</span>
          </HeaderButton>

          <div
            style={{
              width: "1px",
              height: "18px",
              background: "var(--border-muted)",
            }}
          />

          {/* Language selector */}
          <div
            className="tour-language"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              style={{
                background: "#111113",
                border: "1px solid var(--border-default)",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                fontSize: "0.8rem",
                fontWeight: 500,
                fontFamily: "inherit",
                padding: "5px 28px 5px 10px",
                cursor: "pointer",
                outline: "none",
                appearance: "none",
                WebkitAppearance: "none",
                transition: "all 0.18s",
              }}
            >
              {languageOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  style={{ background: "#111" }}
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              color="var(--text-muted)"
              style={{
                position: "absolute",
                right: "8px",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Connection status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "4px 10px",
              background: isConnected
                ? "rgba(52,211,153,0.07)"
                : "rgba(248,113,113,0.07)",
              border: `1px solid ${isConnected ? "rgba(52,211,153,0.18)" : "rgba(248,113,113,0.18)"}`,
              borderRadius: "99px",
              transition: "all 0.4s ease",
            }}
          >
            {isConnected ? (
              <Wifi size={11} color="var(--accent-green)" strokeWidth={2} />
            ) : (
              <WifiOff size={11} color="var(--accent-red)" strokeWidth={2} />
            )}
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: isConnected
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
              }}
            >
              {isConnected ? "LIVE" : "OFFLINE"}
            </span>
            {isConnected && (
              <div
                className="pulse-dot"
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--accent-green)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <div
            style={{
              width: "1px",
              height: "18px",
              background: "var(--border-muted)",
            }}
          />

          {/* Leave Room → parent handles modal */}
          <button
            onClick={onLeaveRoom}
            title="Leave room"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "none",
              border: "1px solid var(--border-default)",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              padding: "5px 10px",
              transition: "all 0.18s",
            }}
            onMouseEnter={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "rgba(248,113,113,0.1)";
              btn.style.borderColor = "rgba(248,113,113,0.35)";
              btn.style.color = "var(--accent-red)";
            }}
            onMouseLeave={(e) => {
              const btn = e.currentTarget as HTMLButtonElement;
              btn.style.background = "none";
              btn.style.borderColor = "var(--border-default)";
              btn.style.color = "var(--text-secondary)";
            }}
          >
            <LogOut size={13} strokeWidth={2} />
            <span>Leave Room</span>
          </button>
        </div>
      </header>

      {/* ── Copy link toast ─────────────────────────────────────────────── */}
      {showToast && (
        <div
          className="toast-in"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            background: "#111113",
            border: "1px solid rgba(52,211,153,0.3)",
            borderRadius: "10px",
            padding: "0.6rem 1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.83rem",
            color: "var(--text-primary)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          <Check size={14} color="var(--accent-green)" strokeWidth={2.5} />
          Invite link copied to clipboard!
        </div>
      )}
    </>
  );
}

function HeaderButton({
  children,
  onClick,
  title,
  active = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        background: active ? "rgba(52,211,153,0.07)" : "none",
        border: `1px solid ${active ? "rgba(52,211,153,0.25)" : "var(--border-default)"}`,
        borderRadius: "6px",
        color: active ? "var(--accent-green)" : "var(--text-secondary)",
        fontSize: "0.8rem",
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: "pointer",
        padding: "5px 10px",
        transition: "all 0.18s",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-hover)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-strong)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-default)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-secondary)";
        }
      }}
    >
      {children}
    </button>
  );
}
