"use client";

import type { ChatMessage } from "@/hooks/useSocket";
import {
    Check,
    Clock,
    Link2,
    LogOut,
    Mail,
    MessageSquare,
    Send,
    Users2,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import InviteEmailModal from "./InviteEmailModal";
import type { ActiveUser } from "./RoomClient";
import VideoCall from "./VideoCall";

interface ActiveUsersSidebarProps {
  users: ActiveUser[];
  currentUserId: string;
  /** Current user's username; used so chat messages stay on correct side after refresh (senderId changes) */
  currentUsername?: string;
  roomId: string;
  roomName?: string;
  isOrganizer?: boolean;
  onKickUser?: (targetSocketId: string) => void;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function ActiveUsersSidebar({
  users,
  currentUserId,
  currentUsername,
  roomId,
  roomName,
  isOrganizer = false,
  onKickUser,
  chatMessages,
  onSendMessage,
}: ActiveUsersSidebarProps) {
  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);

  // Chat States
  const [activeTab, setActiveTab] = useState<"collaborators" | "chat">(
    "collaborators",
  );
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(chatMessages.length);

  // Auto-scroll and unread badge logic
  useEffect(() => {
    if (activeTab === "chat") {
      setUnreadCount(0);
      prevMessageCountRef.current = chatMessages.length;
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (chatMessages.length > prevMessageCountRef.current) {
      setUnreadCount(
        (prev) => prev + (chatMessages.length - prevMessageCountRef.current),
      );
      prevMessageCountRef.current = chatMessages.length;
    }
  }, [chatMessages, activeTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  const roomUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `http://localhost:3000/room/${roomId}`;

  // ── Fetch pending invites (poll every 8s) ───────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const fetchInvites = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/invites`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setPendingInvites(data.emails ?? []);
      } catch {
        // Silently ignore — Redis might be unavailable
      }
    };

    fetchInvites();
    const id = setInterval(fetchInvites, 8000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [roomId]);

  // Also refresh invites after the modal closes (user just sent one)
  const handleInviteClose = async () => {
    setShowInviteModal(false);
    try {
      const res = await fetch(`/api/rooms/${roomId}/invites`, {
        cache: "no-store",
      });
      const data = await res.json();
      setPendingInvites(data.emails ?? []);
    } catch {
      /* ignore */
    }
  };

  const dismissInvite = async (email: string) => {
    setPendingInvites((prev) => prev.filter((e) => e !== email));
    try {
      await fetch(
        `/api/rooms/${roomId}/invites?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        },
      );
    } catch {
      /* ignore */
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {showInviteModal && (
        <InviteEmailModal
          roomId={roomId}
          roomUrl={roomUrl}
          onClose={handleInviteClose}
        />
      )}

      <aside
        style={{
          width: "260px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-muted)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* ─── Room name (above Collaborators) ─── */}
        {roomName && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--border-muted)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "4px",
              }}
            >
              Room
            </div>
            <div
              title={roomName}
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {roomName}
            </div>
          </div>
        )}

        {/* ─── Tabs Header ─── */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-muted)",
            flexShrink: 0,
            background: "var(--bg-header)",
          }}
        >
          <button
            onClick={() => setActiveTab("collaborators")}
            style={{
              flex: 1,
              padding: "12px 10px",
              background:
                activeTab === "collaborators"
                  ? "rgba(255,255,255,0.03)"
                  : "transparent",
              border: "none",
              borderBottom:
                activeTab === "collaborators"
                  ? "2px solid var(--accent-blue)"
                  : "2px solid transparent",
              color:
                activeTab === "collaborators"
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              transition: "all 0.15s",
            }}
          >
            <Users2 size={13} /> Everyone{" "}
            {users.length > 0 && (
              <span style={{ opacity: 0.7 }}>({users.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            style={{
              flex: 1,
              padding: "12px 10px",
              background:
                activeTab === "chat" ? "rgba(255,255,255,0.03)" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "chat"
                  ? "2px solid var(--accent-blue)"
                  : "2px solid transparent",
              color:
                activeTab === "chat"
                  ? "var(--text-primary)"
                  : "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              position: "relative",
              transition: "all 0.15s",
            }}
          >
            <MessageSquare size={13} /> Chat
            {unreadCount > 0 && activeTab !== "chat" && (
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "16px",
                  background: "var(--accent-red)",
                  color: "#fff",
                  fontSize: "0.55rem",
                  padding: "2px 5px",
                  borderRadius: "10px",
                  fontWeight: 800,
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>

        {activeTab === "collaborators" ? (
          <>
            {/* ─── Active users ─── */}
            <ul
              style={{
                padding: "0.4rem 0.5rem",
                listStyle: "none",
                flex: 1,
                overflowY: "auto",
              }}
            >
              {users.map((user, i) => {
                const isMe = user.id === currentUserId;
                const canKick =
                  isOrganizer && onKickUser && !user.isOrganizer && !isMe;
                const color = user.color || "#4f9cf9";
                return (
                  <li
                    key={user.id}
                    className="animate-slide-in"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.4rem 0.6rem",
                      borderRadius: "7px",
                      marginBottom: "1px",
                      background: isMe
                        ? "rgba(79,156,249,0.06)"
                        : "transparent",
                      border: isMe
                        ? "1px solid rgba(79,156,249,0.1)"
                        : "1px solid transparent",
                      transition: "background 0.15s",
                      cursor: "default",
                      animationDelay: `${i * 40}ms`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isMe)
                        (e.currentTarget as HTMLLIElement).style.background =
                          "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isMe)
                        (e.currentTarget as HTMLLIElement).style.background =
                          "transparent";
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: user.emoji ? "var(--bg-primary)" : color,
                        border: user.emoji
                          ? "1px solid var(--border-default)"
                          : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: user.emoji ? "0.9rem" : "0.67rem",
                        fontWeight: 800,
                        color: user.emoji ? "inherit" : "#fff",
                        flexShrink: 0,
                        letterSpacing: "0.02em",
                        boxShadow: isMe
                          ? `0 0 0 2px #000, 0 0 0 3px ${color}55`
                          : "none",
                      }}
                    >
                      {user.emoji || user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: isMe ? 600 : 400,
                          color: isMe
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          lineHeight: 1.3,
                        }}
                      >
                        {user.username}
                      </p>
                      <p
                        style={{
                          fontSize: "0.62rem",
                          color: isMe
                            ? "var(--accent-blue)"
                            : "var(--text-muted)",
                          lineHeight: 1,
                          marginTop: "1px",
                        }}
                      >
                        {isMe
                          ? "you"
                          : user.isOrganizer
                            ? "organizer"
                            : "collaborator"}
                      </p>
                    </div>
                    {canKick ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onKickUser(user.id);
                        }}
                        title="Remove from room"
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "6px",
                          border: "1px solid var(--border-muted)",
                          background: "transparent",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "color 0.15s, border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "var(--accent-red)";
                          e.currentTarget.style.borderColor =
                            "rgba(248,113,113,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.borderColor =
                            "var(--border-muted)";
                        }}
                      >
                        <LogOut size={12} strokeWidth={2} />
                      </button>
                    ) : (
                      <div
                        className={isMe ? "pulse-dot" : ""}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                          opacity: 0.85,
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            {/* ─── Pending invites section ─── */}
            {pendingInvites.length > 0 && (
              <div
                style={{
                  borderTop: "1px solid var(--border-muted)",
                  padding: "0.5rem 0.6rem",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0 0.4rem 0.4rem",
                  }}
                >
                  <Clock size={11} color="var(--text-muted)" strokeWidth={2} />
                  <p
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--text-muted)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Awaiting
                  </p>
                  <span
                    style={{
                      marginLeft: "auto",
                      background: "rgba(250,176,5,0.1)",
                      border: "1px solid rgba(250,176,5,0.2)",
                      borderRadius: "99px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#f59e0b",
                      padding: "1px 6px",
                    }}
                  >
                    {pendingInvites.length}
                  </span>
                </div>

                <ul
                  style={{
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  {pendingInvites.map((email) => (
                    <li
                      key={email}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.35rem 0.6rem",
                        borderRadius: "7px",
                        background: "rgba(250,176,5,0.04)",
                        border: "1px solid rgba(250,176,5,0.1)",
                      }}
                    >
                      {/* amber avatar placeholder */}
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "rgba(245,158,11,0.15)",
                          border: "1px dashed rgba(245,158,11,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Mail size={10} color="#f59e0b" strokeWidth={2} />
                      </div>
                      <p
                        style={{
                          fontSize: "0.73rem",
                          color: "var(--text-muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                          minWidth: 0,
                        }}
                        title={email}
                      >
                        {email}
                      </p>
                      <button
                        onClick={() => dismissInvite(email)}
                        title="Dismiss"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: "2px",
                          borderRadius: "4px",
                          display: "flex",
                          flexShrink: 0,
                          opacity: 0.6,
                          transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.opacity =
                            "1";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.opacity =
                            "0.6";
                        }}
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ─── Invite actions ─── */}
            <div
              style={{
                padding: "0.6rem 0.6rem 0.8rem",
                borderTop: "1px solid var(--border-muted)",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  padding: "0 0.4rem 0.2rem",
                }}
              >
                Invite
              </p>

              <SidebarButton
                onClick={copyLink}
                active={copied}
                icon={
                  copied ? (
                    <Check size={13} strokeWidth={2.5} />
                  ) : (
                    <Link2 size={13} strokeWidth={1.8} />
                  )
                }
                label={copied ? "Link Copied!" : "Copy Room Link"}
                activeColor="var(--accent-green)"
                activeBg="rgba(52,211,153,0.08)"
                activeBorder="rgba(52,211,153,0.25)"
              />

              <SidebarButton
                onClick={() => setShowInviteModal(true)}
                icon={<Mail size={13} strokeWidth={1.8} />}
                label="Invite via Email"
              />
            </div>
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              overflow: "hidden",
              background: "var(--bg-primary)",
            }}
          >
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                scrollbarWidth: "thin",
              }}
            >
              {chatMessages.length === 0 ? (
                <div
                  style={{
                    margin: "auto",
                    color: "var(--text-muted)",
                    fontSize: "0.80rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    opacity: 0.8,
                  }}
                >
                  <MessageSquare
                    size={32}
                    strokeWidth={1.5}
                    color="var(--text-muted)"
                  />
                  <div>
                    No messages yet.
                    <br />
                    Start the conversation!
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  // Use senderId (socket.id) OR senderName so our messages stay right after refresh
                  const isMe =
                    msg.senderId === currentUserId ||
                    (!!currentUsername && msg.senderName === currentUsername);
                  const showSenderName =
                    !isMe &&
                    (idx === 0 ||
                      chatMessages[idx - 1].senderId !== msg.senderId);

                  return (
                    <div
                      key={`${msg.senderId}-${msg.timestamp}-${idx}`}
                      style={{
                        alignSelf: isMe ? "flex-end" : "flex-start",
                        maxWidth: "85%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      {showSenderName && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            color: "var(--text-muted)",
                            marginBottom: "4px",
                            fontWeight: 600,
                            paddingLeft: "4px",
                          }}
                        >
                          {msg.senderName}
                        </span>
                      )}
                      <div
                        style={{
                          background: isMe
                            ? "rgba(79,156,249,0.15)"
                            : "rgba(255,255,255,0.06)",
                          border: isMe
                            ? "1px solid rgba(79,156,249,0.3)"
                            : "1px solid var(--border-muted)",
                          padding: "8px 10px",
                          borderRadius: "10px",
                          borderTopRightRadius: isMe ? "2px" : "10px",
                          borderTopLeftRadius: !isMe ? "2px" : "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-primary)",
                            wordBreak: "break-word",
                            lineHeight: "1.4",
                          }}
                        >
                          {msg.text}
                        </span>
                        <span
                          style={{
                            fontSize: "0.55rem",
                            color: "var(--text-muted)",
                            alignSelf: "flex-end",
                            marginTop: "2px",
                            opacity: 0.8,
                          }}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div
                ref={chatScrollRef}
                style={{ float: "left", clear: "both" }}
              />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: "10px",
                borderTop: "1px solid var(--border-muted)",
                display: "flex",
                gap: "8px",
                background: "var(--bg-sidebar)",
              }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-muted)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  color: "var(--text-primary)",
                  fontSize: "0.8rem",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-strong)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-muted)";
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                title="Send Message"
                style={{
                  background: chatInput.trim()
                    ? "var(--accent-blue)"
                    : "rgba(79,156,249,0.1)",
                  border: "none",
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  color: chatInput.trim() ? "#fff" : "rgba(79,156,249,0.4)",
                  cursor: chatInput.trim() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s, color 0.2s",
                  flexShrink: 0,
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}

function SidebarButton({
  onClick,
  icon,
  label,
  active = false,
  activeColor = "var(--text-primary)",
  activeBg = "var(--bg-hover)",
  activeBorder = "var(--border-strong)",
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  activeBg?: string;
  activeBorder?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        background: active ? activeBg : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? activeBorder : "var(--border-muted)"}`,
        borderRadius: "7px",
        color: active ? activeColor : "var(--text-secondary)",
        fontSize: "0.8rem",
        fontWeight: 500,
        fontFamily: "inherit",
        padding: "7px 10px",
        cursor: "pointer",
        transition: "all 0.18s",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "var(--bg-hover)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-default)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-primary)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.03)";
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--border-muted)";
          (e.currentTarget as HTMLButtonElement).style.color =
            "var(--text-secondary)";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
