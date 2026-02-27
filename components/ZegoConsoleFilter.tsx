"use client";

import { useEffect } from "react";

/**
 * Suppresses known harmless Zego SDK console errors:
 * - "stream does not exist" (err:1004) when a participant leaves and
 *   the SDK tries to play their stream. Zego retries and recovers; no action needed.
 */
export default function ZegoConsoleFilter() {
  useEffect(() => {
    const original = console.error;
    console.error = (...args: unknown[]) => {
      const str = args
        .map((a) =>
          typeof a === "object" && a !== null ? JSON.stringify(a) : String(a),
        )
        .join(" ");
      if (
        (str.includes("err:1004") || str.includes("stream does not exist")) &&
        (str.includes("play stream interrupted") ||
          str.includes("playStateUpdateError") ||
          str.includes("zc.p.psr"))
      ) {
        return;
      }
      // Login cancelled before join completes.
      if (str.includes("1102026") || str.toLowerCase().includes("cancel login")) {
        return;
      }
      // Publish/create stream failures that happen during teardown.
      if (
        str.includes("createStream or publishLocalStream failed") ||
        str.includes("【ZEGOCLOUD】createStream")
      ) {
        return;
      }
      original.apply(console, args);
    };
    return () => {
      console.error = original;
    };
  }, []);
  return null;
}
