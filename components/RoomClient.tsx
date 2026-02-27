"use client";

import { useSocket } from "@/hooks/useSocket";
import { useTimer } from "@/hooks/useTimer";
import { isValidRoomId } from "@/lib/roomId";
import { Maximize2, Minimize2, Minus, Square, Video, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Draggable from "react-draggable";
import ActiveUsersSidebar from "./ActiveUsersSidebar";
import EditorHeader from "./EditorHeader";
import ErrorBoundary, {
  EditorFallback,
  VideoFallback,
} from "./ErrorBoundary";
import LeaveModal from "./LeaveModal";
import type MonacoEditorWrapperType from "./MonacoEditorWrapper";
import OfflinePage from "./OfflinePage";
import OutputTerminal, { type ExecutionResult } from "./OutputTerminal";
import ProductTour from "./ProductTour";
import RoomError, { type RoomErrorKind } from "./RoomError";
import RoomLoader from "./RoomLoader";
import RoomLobby from "./RoomLobby";
// import VideoCall from "./VideoCall";

// ADD karo ye (baaki dynamic imports ke paas):
const VideoCall = dynamic(() => import("./VideoCall"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 200,
        background: "#0d0d0d",
        color: "#71717a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.875rem",
      }}
    >
      Loading video…
    </div>
  ),
});

const MonacoEditorComponent = dynamic(() => import("./MonacoEditorWrapper"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d0d0d",
        color: "#52525b",
        fontSize: "0.875rem",
        fontFamily: "'JetBrains Mono', monospace",
        gap: "0.5rem",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          border: "2px solid #27272a",
          borderTopColor: "#4f9cf9",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      Loading editor…
    </div>
  ),
}) as React.ComponentType<ComponentProps<typeof MonacoEditorWrapperType>>;

export type ActiveUser = {
  id: string;
  username: string;
  color: string;
  emoji?: string;
  isOrganizer?: boolean;
};

const BOILERPLATES: Record<string, string> = {
  sql: "CREATE TABLE users (id INT PRIMARY KEY, name TEXT, role TEXT);\nINSERT INTO users VALUES (1, 'Himanshu', 'Admin'), (2, 'Guest', 'User');\nSELECT * FROM users;",
  cpp: '#include <iostream>\nint main() {\n    std::cout << "Hello from SyncCode C++!" << std::endl;\n    return 0;\n}',
  python: 'print("Hello from SyncCode Python!")',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from SyncCode Java!");\n    }\n}',
};

const LANGUAGE_OPTIONS = [
  { label: "C++", value: "cpp" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "SQL", value: "sql" },
];

interface RoomClientProps {
  roomId: string;
}

export default function RoomClient({ roomId }: RoomClientProps) {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [username, setUsername] = useState("");
  const [userEmoji, setUserEmoji] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [roomError, setRoomError] = useState<RoomErrorKind | null>(null);
  const [roomName, setRoomName] = useState<string>("");
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    if (!isValidRoomId(roomId)) {
      setRoomError("invalid_id");
      setIsChecking(false);
      return;
    }

    fetch(`/api/rooms/${roomId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Room fetch failed");
        return res.json();
      })
      .then((data) => {
        if (data && data.name) setRoomName(data.name);
      })
      .catch(() => {
        // Room meta optional; keep default room name on failure
      });

    const savedName = localStorage.getItem("synccode-display-name");
    const savedRoomId = localStorage.getItem("synccode-room-id");
    const savedEmoji = localStorage.getItem("synccode-display-emoji");
    if (savedName && savedRoomId === roomId) {
      setUsername(savedName);
      setUserEmoji(savedEmoji || "");
      setJoined(true);
    }
    setIsChecking(false);
  }, [roomId]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return <OfflinePage />;
  }

  if (isChecking) {
    return <RoomLoader />;
  }

  if (roomError) {
    return <RoomError kind={roomError} />;
  }

  // ── Show lobby until user clicks Join ────────────────────────────────────
  if (!joined) {
    return (
      <RoomLobby
        roomId={roomId}
        onJoin={(name, emoji) => {
          setUsername(name);
          setUserEmoji(emoji);
          setJoined(true);
          localStorage.setItem("synccode-display-name", name);
          localStorage.setItem("synccode-room-id", roomId);
          localStorage.setItem("synccode-display-emoji", emoji);
        }}
        onRoomError={() => setRoomError("room_not_found")}
      />
    );
  }

  return (
    <RoomEditor
      roomId={roomId}
      roomName={roomName}
      username={username}
      userEmoji={userEmoji}
      router={router}
      onRoomError={() => setRoomError("room_not_found")}
      onKicked={() => setRoomError("kicked")}
    />
  );
}

// Separated so useSocket is only called AFTER the user has joined
function RoomEditor({
  roomId,
  roomName,
  username,
  userEmoji,
  router,
  onRoomError,
  onKicked,
}: {
  roomId: string;
  roomName: string;
  username: string;
  userEmoji: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
  onRoomError: () => void;
  onKicked: () => void;
}) {
  const [code, setCode] = useState(BOILERPLATES["python"]);
  const [language, setLanguage] = useState("python");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [videoKey, setVideoKey] = useState(0);
  const [editorKey, setEditorKey] = useState(0);

  // Video call state
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [isVideoExpanded, setIsVideoExpanded] = useState(false);
  const videoNodeRef = useRef<HTMLDivElement>(null);
  const videoCallHelpersRef = useRef<{
    stopAllTracks: () => void;
    destroyNow: () => void;
  } | null>(null);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const isRemoteChange = useRef(false);

  /** Peer sent a code change */
  const handleRemoteCodeChange = useCallback((incomingCode: string) => {
    isRemoteChange.current = true;
    setCode(incomingCode);
  }, []);

  /** Peer changed language */
  const handleRemoteLanguageChange = useCallback((incomingLanguage: string) => {
    setLanguage(incomingLanguage);
  }, []);

  /** Redis hydration — new joiner receives persisted state immediately */
  const handleInitialState = useCallback(
    (persistedCode: string, persistedLanguage: string | null) => {
      isRemoteChange.current = true;
      setCode(persistedCode);
      if (persistedLanguage) setLanguage(persistedLanguage);
    },
    [],
  );

  const {
    socket,
    isConnected,
    activeUsers,
    chatMessages,
    emitCodeChange,
    emitKickUser,
    emitChatMessage,
  } = useSocket({
    roomId,
    username,
    emoji: userEmoji,
    onCodeChange: handleRemoteCodeChange,
    onRemoteLanguageChange: handleRemoteLanguageChange,
    onInitialState: handleInitialState,
    onJoinError: onRoomError,
    onKicked: onKicked,
  });

  const {
    isRunning: timerRunning,
    remaining: timerRemaining,
    toggleTimer,
    resetTimer,
  } = useTimer(socket, roomId);

  /** Leave room states & handlers */
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const isBackNavigation = useRef(false);

  // Prevent accidental reload/close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Most modern browsers ignore this string, but it's required for the prompt to show.
      e.returnValue = "Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Prevent back button
  useEffect(() => {
    // Push a dummy state so the first "back" just pops this state, leaving the URL the same
    window.history.pushState({ dummy: true }, "", window.location.href);

    const handlePopState = () => {
      isBackNavigation.current = true;
      setShowLeaveModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /** Leave room: gracefully disconnect socket then go home */
  const handleLeaveConfirm = useCallback(() => {
    if (socket?.connected) socket.disconnect();
    localStorage.removeItem("synccode-display-name");
    localStorage.removeItem("synccode-room-id");
    localStorage.removeItem("synccode-display-emoji");
    router.push("/");
  }, [socket, router]);

  const handleLeaveCancel = useCallback(() => {
    setShowLeaveModal(false);
    if (isBackNavigation.current) {
      // Re-push the dummy state so they can't go back directly again
      window.history.pushState({ dummy: true }, "", window.location.href);
      isBackNavigation.current = false;
    }
  }, []);

  const handleLeaveRoomClick = useCallback(() => {
    setShowLeaveModal(true);
  }, []);

  const handleVideoLeave = useCallback(() => {
    const h = videoCallHelpersRef.current;
    if (h) {
      h.destroyNow();
      h.stopAllTracks();
    }
    setIsVideoOpen(false);
    setIsVideoMinimized(false);
    setVideoKey((prev) => prev + 1);
  }, []);

  const handleToggleVideo = useCallback(() => {
    if (isVideoOpen) {
      const h = videoCallHelpersRef.current;
      if (h) {
        h.destroyNow();
        h.stopAllTracks();
      }
      setIsVideoOpen(false);
      setIsVideoMinimized(false);
      setVideoKey((prev) => prev + 1);
    } else {
      setIsVideoOpen(true);
    }
  }, [isVideoOpen]);

  /** Change language & apply boilerplate if needed */
  const handleLanguageChange = useCallback(
    (newLang: string) => {
      setLanguage(newLang);

      // Remove all whitespace to check if the user has modified the boilerplate logic
      const stripWhitespace = (str: string) => str.replace(/\s/g, "");

      const isCurrentBoilerplate =
        Object.values(BOILERPLATES).some(
          (bp) => stripWhitespace(bp) === stripWhitespace(code),
        ) || code.trim() === "";

      if (isCurrentBoilerplate) {
        const newBoilerplate = BOILERPLATES[newLang] || "";
        setCode(newBoilerplate);
        emitCodeChange(newBoilerplate, newLang);
      } else {
        emitCodeChange(code, newLang);
      }
    },
    [code, emitCodeChange],
  );

  /** Execute Code */
  const handleRunCode = async () => {
    setIsExecuting(true);
    setExecutionResult(null);

    let codeToRun = code;
    const editor = editorRef.current;

    if (editor) {
      const selection = editor.getSelection();
      let selectedText = "";
      if (selection && !selection.isEmpty()) {
        selectedText = editor.getModel()?.getValueInRange(selection) || "";
      }

      if (selectedText.trim() !== "") {
        codeToRun = selectedText;

        // Prepend schema setup for SQL
        if (language === "sql") {
          const sqlBoilerplate = BOILERPLATES["sql"];
          const schemaLines = sqlBoilerplate
            .split("\n")
            .filter(
              (line) =>
                line.toUpperCase().startsWith("CREATE") ||
                line.toUpperCase().startsWith("INSERT"),
            );
          if (schemaLines.length > 0) {
            codeToRun = schemaLines.join("\n") + "\n\n" + codeToRun;
          }
        }
      }
    }

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code: codeToRun }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExecutionResult({ error: data.error || "Execution failed." } as any);
      } else {
        setExecutionResult(data);
      }
    } catch (err) {
      setExecutionResult({
        error: "Network error occurred. The execution service might be down.",
      } as any);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunCodeRef = useRef(handleRunCode);
  handleRunCodeRef.current = handleRunCode;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCodeRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Monaco onChange — local user typed something.
   * Skip emitting if the change came from a remote update.
   */
  const handleEditorChange = (val: string | undefined) => {
    const newCode = val ?? "";
    if (isRemoteChange.current) {
      isRemoteChange.current = false;
      setCode(newCode);
      return;
    }
    setCode(newCode);
    emitCodeChange(newCode, language);
  };

  const currentUser = activeUsers.find((u) => u.username === username);
  const currentUserId = currentUser?.id ?? "";
  const isOrganizer = currentUser?.isOrganizer ?? false;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <ProductTour />

      {showLeaveModal && (
        <LeaveModal
          roomId={roomId}
          onConfirm={handleLeaveConfirm}
          onCancel={handleLeaveCancel}
        />
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "var(--bg-primary)",
          overflow: "hidden",
        }}
      >
        <EditorHeader
          roomId={roomId}
          language={language}
          onLanguageChange={handleLanguageChange}
          languageOptions={LANGUAGE_OPTIONS}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          isConnected={isConnected}
          onLeaveRoom={handleLeaveRoomClick}
          onRunCode={handleRunCode}
          isExecuting={isExecuting}
          timerRunning={timerRunning}
          timerRemaining={timerRemaining}
          onToggleTimer={toggleTimer}
          onResetTimer={resetTimer}
          isVideoOpen={isVideoOpen}
          isVideoMinimized={isVideoMinimized}
          onToggleVideo={handleToggleVideo}
          onMaximizeVideo={() => setIsVideoMinimized(false)}
        />

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {sidebarOpen && (
            <ActiveUsersSidebar
              users={activeUsers}
              currentUserId={currentUserId}
              currentUsername={username}
              roomId={roomId}
              roomName={roomName}
              isOrganizer={isOrganizer}
              onKickUser={emitKickUser}
              chatMessages={chatMessages}
              onSendMessage={emitChatMessage}
            />
          )}

          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ErrorBoundary
              key={editorKey}
              fallback={
                <EditorFallback
                  onRetry={() => setEditorKey((k) => k + 1)}
                />
              }
            >
              <div
                className="tour-editor"
                style={{ flex: 1, position: "relative", minHeight: 0 }}
              >
                <MonacoEditorComponent
                  code={code}
                  language={language}
                  onChange={handleEditorChange}
                  onMount={(editor: unknown) => {
                    editorRef.current = editor;
                  }}
                />
              </div>
            </ErrorBoundary>

            {/* 6. Add OutputTerminal component under MonacoEditorComponent */}
            <OutputTerminal
              result={executionResult}
              isExecuting={isExecuting}
            />
          </div>
        </div>

        {/* Draggable Video Call Panel */}
        {isVideoOpen && (
          <Draggable
            nodeRef={videoNodeRef}
            handle=".drag-handle"
            bounds="parent"
            defaultPosition={{ x: -20, y: -20 }}
          >
            <div
              ref={videoNodeRef}
              style={{
                position: "absolute",
                bottom: "30px",
                right: "30px",
                width: isVideoMinimized
                  ? "260px"
                  : isVideoExpanded
                    ? "800px"
                    : "640px",
                height: isVideoMinimized
                  ? "56px"
                  : isVideoExpanded
                    ? "450px"
                    : "360px",
                maxWidth: "90vw",
                maxHeight: "70vh",
                minWidth: isVideoMinimized ? "260px" : "480px",
                minHeight: isVideoMinimized ? "56px" : "320px",
                zIndex: 9999,
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                border: "1px solid var(--border-default)",
                background: "var(--bg-primary)",
                display: "flex",
                flexDirection: "column",
                transition: "width 0.2s ease, height 0.2s ease",
              }}
            >
              <div
                className="drag-handle"
                style={{
                  background: "var(--bg-header)",
                  padding: "8px 12px",
                  cursor: "grab",
                  borderBottom: "1px solid var(--border-muted)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Video size={14} color="var(--accent-blue)" />
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Video Call {isVideoMinimized ? "(Audio Active)" : ""}
                  </span>
                </div>

                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isVideoMinimized) {
                        setIsVideoExpanded((prev) => !prev);
                      } else {
                        setIsVideoMinimized(false);
                        setIsVideoExpanded(true);
                      }
                    }}
                    title={
                      isVideoExpanded
                        ? "Exit Focus View"
                        : "Focus / Expand View"
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      padding: "2px",
                      position: "relative",
                      zIndex: 11,
                    }}
                  >
                    {isVideoExpanded ? (
                      <Minimize2 size={13} />
                    ) : (
                      <Square size={13} />
                    )}
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextMin = !isVideoMinimized;
                      setIsVideoMinimized(nextMin);
                      if (nextMin) {
                        setIsVideoExpanded(false);
                      }
                    }}
                    title={
                      isVideoMinimized ? "Maximize Video" : "Minimize Video"
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      padding: "2px",
                      position: "relative",
                      zIndex: 11,
                    }}
                  >
                    {isVideoMinimized ? (
                      <Maximize2 size={13} />
                    ) : (
                      <Minus size={13} />
                    )}
                  </button>
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoExpanded(false);
                      handleVideoLeave(); // camera properly band karega
                    }}
                    title="Close Video"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      padding: "2px",
                      position: "relative",
                      zIndex: 11,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Keep Zego container at fixed 640x360 so it never resizes;
                  resizing on maximize was triggering Zego createSpan null and panel close. */}
              <div
                style={{
                  position: "relative",
                  flex: isVideoMinimized ? 0 : 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: isVideoMinimized ? "absolute" : "relative",
                    left: isVideoMinimized ? 0 : undefined,
                    top: isVideoMinimized ? 0 : undefined,
                    width: isVideoMinimized ? "640px" : "100%",
                    height: isVideoMinimized ? "360px" : "100%",
                    visibility: isVideoMinimized ? "hidden" : "visible",
                    pointerEvents: isVideoMinimized ? "none" : "auto",
                    background: "#0d0d0d",
                  }}
                >
                  <style>{`
                    #video-modal-container {
                      width: 100% !important;
                      height: 100% !important;
                      min-height: 200px;
                      display: flex;
                      align-items: stretch;
                    }
                    #video-modal-container > div {
                      border-radius: 0 0 12px 12px;
                      overflow: hidden;
                      width: 100% !important;
                      height: 100% !important;
                      display: flex;
                    }
                    
                    #video-modal-container video {
                      object-fit: cover !important;
                      width: 100% !important;
                      height: 100% !important;
                    }
                  `}</style>
                  <div
                    id="video-modal-container"
                    style={{
                      width: "100%",
                      height: "100%",
                      minHeight: 200,
                    }}
                  >
                    <ErrorBoundary
                      key={videoKey}
                      fallback={
                        <VideoFallback
                          onRetry={() => setVideoKey((k) => k + 1)}
                        />
                      }
                    >
                      <VideoCall
                        key={videoKey}
                        roomId={roomId}
                        username={username}
                        onLeave={handleVideoLeave}
                        onReady={(helpers) => {
                          videoCallHelpersRef.current = helpers;
                        }}
                      />
                    </ErrorBoundary>
                  </div>
                </div>
              </div>
            </div>
          </Draggable>
        )}
      </div>
    </>
  );
}
