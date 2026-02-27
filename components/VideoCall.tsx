"use client";

import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";

export interface VideoCallReadyHelpers {
  stopAllTracks: () => void;
  destroyNow: () => void;
}

interface VideoCallProps {
  roomId: string;
  username: string;
  onLeave: () => void;
  onReady?: (helpers: VideoCallReadyHelpers) => void;
}

function stopMediaTracksInElement(root: Element | Document): void {
  root.querySelectorAll("video, audio").forEach((el) => {
    const src = (el as HTMLVideoElement).srcObject;
    const stream = src instanceof MediaStream ? src : null;
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  });
}

function stopAllTracksImpl(
  containerRef: RefObject<HTMLDivElement | null>,
): void {
  if (containerRef.current) {
    stopMediaTracksInElement(containerRef.current);
  }
  const byId = (id: string) => document.getElementById(id);
  [byId("video-container"), byId("video-modal-container")].forEach((el) => {
    if (el) stopMediaTracksInElement(el);
  });
}

export default function VideoCall({
  roomId,
  username,
  onLeave,
  onReady,
}: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zpRef = useRef<InstanceType<typeof ZegoUIKitPrebuilt> | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);

  useEffect(() => {
    if (!onReady) return;
    onReady({
      stopAllTracks: () => stopAllTracksImpl(containerRef),
      destroyNow() {
        if (zpRef.current) {
          const z = zpRef.current;
          zpRef.current = null;
          try {
            z.destroy();
          } catch {
            // ignore
          }
        }
      },
    });
  }, [onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
    const serverSecret = process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET;

    if (!appID || !serverSecret) {
      setStatus("error");
      setErrorMessage(
        "Video credentials not configured. Add NEXT_PUBLIC_ZEGO_APP_ID and NEXT_PUBLIC_ZEGO_SERVER_SECRET to .env.local, then restart the dev server (stop and run npm run dev again).",
      );
      return;
    }

    setStatus("loading");

    // Let the container get layout (non-zero size) before Zego mounts
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const el = containerRef.current;
      const rect = el.getBoundingClientRect();
      if (rect.width < 10 || rect.height < 10) {
        setStatus("error");
        setErrorMessage("Video area too small. Try expanding the video panel.");
        return;
      }

      try {
        const userId =
          username.replace(/[^a-zA-Z0-9]/g, "") +
          "_" +
          Math.floor(Math.random() * 100000);
        const serverSecretTrimmed = String(serverSecret)
          .trim()
          .replace(/^"|"$/g, "");
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecretTrimmed,
          roomId,
          userId,
          username,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpRef.current = zp;

        zp.joinRoom({
          container: el,
          scenario: {
            mode: ZegoUIKitPrebuilt.GroupCall,
          },
          maxUsers: 4,
          layout: "Auto",
          showLayoutButton: true,
          showPinButton: true,
          showUserList: true,
          showNonVideoUser: false,
          showOnlyAudioUser: false,
          showPreJoinView: false,
          showRoomDetailsButton: false,
          showTextChat: false,
          showScreenSharingButton: false,
          showAudioVideoSettingsButton: false,
          showTurnOffRemoteCameraButton: true,
          showTurnOffRemoteMicrophoneButton: true,
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          videoResolutionDefault: ZegoUIKitPrebuilt.VideoResolution_480P,
          onLeaveRoom: () => {
            onLeaveRef.current();
          },
        });

        setStatus("ready");
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Video failed to start";
        setStatus("error");
        setErrorMessage(msg);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (zpRef.current) {
        const instance = zpRef.current;
        zpRef.current = null;
        try {
          instance.destroy();
        } catch {
          // ignore Zego destroy errors during teardown
        }
      }
    };
  }, [roomId, username]);

  if (status === "error") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          minHeight: 200,
          background: "#0B0E14",
          color: "#a1a1aa",
          padding: 16,
          fontSize: "0.875rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 8,
        }}
      >
        <span>Video couldn’t start</span>
        <span style={{ color: "#71717a", fontSize: "0.75rem" }}>
          {errorMessage}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 200,
      }}
    >
      <style>{`
        #video-container button[title*="leave" i],
        #video-container button[title*="end" i],
        #video-container button[aria-label*="leave" i],
        #video-container button[aria-label*="end" i] {
          display: none !important;
        }
      `}</style>
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0B0E14",
            color: "#71717a",
            fontSize: "0.875rem",
            zIndex: 1,
          }}
        >
          Loading video…
        </div>
      )}
      <div
        id="video-container"
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 200,
          background: "#0B0E14",
        }}
      />
    </div>
  );
}
