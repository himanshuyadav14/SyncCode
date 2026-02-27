"use client";

import type { ActiveUser } from "@/components/RoomClient";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

export type ChatMessage = {
  roomId: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: number;
};

interface UseSocketOptions {
  roomId: string;
  username: string;
  emoji?: string;
  /** Called when a peer sends a code update */
  onCodeChange: (code: string) => void;
  /** Called when a peer's language changes */
  onRemoteLanguageChange?: (language: string) => void;
  /** Called when Redis returns initial state for a room (new joiner) */
  onInitialState: (code: string, language: string | null) => void;
  onUsersUpdate?: (users: ActiveUser[]) => void;
  /** Called when server rejects join (e.g. room_not_found) */
  onJoinError?: (reason: string) => void;
  /** Called when this socket was kicked by organizer */
  onKicked?: () => void;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: ActiveUser[];
  chatMessages: ChatMessage[];
  /** Emit a local code change to the server with the current language */
  emitCodeChange: (code: string, language: string) => void;
  /** Emit kick (organizer only); server will validate */
  emitKickUser: (targetSocketId: string) => void;
  /** Emit a chat message */
  emitChatMessage: (text: string) => void;
}

export function useSocket({
  roomId,
  username,
  emoji = "",
  onCodeChange,
  onRemoteLanguageChange,
  onInitialState,
  onJoinError,
  onKicked,
}: UseSocketOptions): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const onCodeChangeRef = useRef(onCodeChange);
  const onRemoteLanguageChangeRef = useRef(onRemoteLanguageChange);
  const onInitialStateRef = useRef(onInitialState);
  onCodeChangeRef.current = onCodeChange;
  onRemoteLanguageChangeRef.current = onRemoteLanguageChange;
  onInitialStateRef.current = onInitialState;

  useEffect(() => {
    if (!roomId || !username) return;

    const socketUrl =
      typeof window !== "undefined"
        ? process.env.NEXT_PUBLIC_SOCKET_URL
        : undefined;
    const socket = io(socketUrl ?? "", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomId, username, emoji });
    });

    socket.on("join-error", ({ reason }: { reason: string }) => {
      onJoinError?.(reason);
    });

    socket.on("kicked", () => {
      onKicked?.();
    });

    socket.on("room-users", (users: ActiveUser[]) => {
      setActiveUsers(users);
    });

    socket.on(
      "initial-state",
      ({ code, language }: { code: string; language: string | null }) => {
        onInitialStateRef.current(code, language);
      },
    );

    socket.on("user-joined", (user: ActiveUser) => {
      setActiveUsers((prev) =>
        prev.some((u) => u.id === user.id) ? prev : [...prev, user],
      );
    });

    socket.on("user-left", ({ id }: { id: string }) => {
      setActiveUsers((prev) => prev.filter((u) => u.id !== id));
    });

    // ── code-change: incoming update from a peer ─────────────────────────────
    socket.on(
      "code-change",
      ({ code, language }: { code: string; language?: string }) => {
        onCodeChangeRef.current(code);
        if (language) {
          onRemoteLanguageChangeRef.current?.(language);
        }
      },
    );

    socket.on("chat-history", (messages: ChatMessage[]) => {
      setChatMessages(messages);
    });

    // ── receive-message ──────────────────────────────────────────────────────
    socket.on("receive-message", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username, emoji]);

  /**
   * Emit a code change to peers AND let the server know the current language
   * so Redis can persist it.
   */
  const emitCodeChange = (code: string, language: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("code-change", { roomId, code, language });
    }
  };

  const emitKickUser = (targetSocketId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("kick-user", { roomId, targetSocketId });
    }
  };

  const emitChatMessage = (text: string) => {
    if (socketRef.current?.connected) {
      const message: ChatMessage = {
        roomId,
        text,
        senderId: socketRef.current.id || "",
        senderName: username,
        timestamp: Date.now(),
      };
      // Optimistic update
      setChatMessages((prev) => [...prev, message]);
      socketRef.current.emit("send-message", message);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    chatMessages,
    emitCodeChange,
    emitKickUser,
    emitChatMessage,
  };
}
