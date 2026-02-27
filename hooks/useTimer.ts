import { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

export interface TimerState {
  isRunning: boolean;
  duration: number;
  remaining: number;
  lastUpdateAt: number;
}

const DEFAULT_DURATION = 45 * 60; // 45 minutes

export function useTimer(socket: Socket | null | undefined, roomId: string) {
  const [remaining, setRemaining] = useState(DEFAULT_DURATION);
  const [isRunning, setIsRunning] = useState(false);

  // Track the actual server state to calculate correct elapsed time locally
  const stateRef = useRef<TimerState | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleSync = (state: TimerState) => {
      stateRef.current = state;
      setIsRunning(state.isRunning);
      setRemaining(
        state.isRunning
          ? Math.max(
              0,
              state.remaining -
                Math.floor((Date.now() - state.lastUpdateAt) / 1000),
            )
          : state.remaining,
      );
    };

    socket.on("timer:sync", handleSync);
    return () => {
      socket.off("timer:sync", handleSync);
    };
  }, [socket]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!stateRef.current) return;

      const { remaining: stateRemaining, lastUpdateAt } = stateRef.current;
      const elapsed = Math.floor((Date.now() - lastUpdateAt) / 1000);
      const newRemaining = Math.max(0, stateRemaining - elapsed);

      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        setIsRunning(false);
        if (socket?.connected) {
          socket.emit("timer:pause", {
            roomId,
            duration: DEFAULT_DURATION,
            remaining: 0,
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, socket, roomId]);

  const toggleTimer = () => {
    if (!socket?.connected) return;
    if (isRunning) {
      socket.emit("timer:pause", {
        roomId,
        duration: DEFAULT_DURATION,
        remaining,
      });
    } else {
      socket.emit("timer:start", {
        roomId,
        duration: DEFAULT_DURATION,
        remaining: remaining === 0 ? DEFAULT_DURATION : remaining,
      });
    }
  };

  const resetTimer = () => {
    if (!socket?.connected) return;
    socket.emit("timer:reset", { roomId, duration: DEFAULT_DURATION });
  };

  return { isRunning, remaining, toggleTimer, resetTimer };
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
