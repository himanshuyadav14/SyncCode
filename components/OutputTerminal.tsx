"use client";

import { Check, Copy, TerminalSquare, X } from "lucide-react";
import { MouseEvent, useEffect, useRef, useState } from "react";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  error?: string;
}

interface OutputTerminalProps {
  result: ExecutionResult | null;
  isExecuting: boolean;
}

export default function OutputTerminal({
  result,
  isExecuting,
}: OutputTerminalProps) {
  const [height, setHeight] = useState(240); // Initial height in px
  const [copied, setCopied] = useState(false);
  const isDragging = useRef(false);

  // Resize handler
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      // Calculate new height based on mouse position from bottom
      const newHeight = window.innerHeight - e.clientY;
      // Min 100px, Max 80% of window
      setHeight(Math.max(100, Math.min(newHeight, window.innerHeight * 0.8)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    // @ts-expect-error - attaching to global window
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      // @ts-expect-error - removing
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = result.stderr
      ? result.stderr + "\n" + result.stdout
      : result.stdout;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        height: `${height}px`,
        background: "#060608",
        borderTop: "1px solid var(--border-muted)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* ─── Drag Handle ─── */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: "4px",
          width: "100%",
          position: "absolute",
          top: "-2px",
          cursor: "row-resize",
          zIndex: 20,
        }}
      />

      {/* ─── Header ─── */}
      <div
        style={{
          padding: "0 1rem",
          height: "36px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid var(--border-muted)",
          background: "rgba(255, 255, 255, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TerminalSquare size={14} color="var(--text-muted)" />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--text-secondary)",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Output Terminal
          </span>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={handleCopy}
            disabled={!result}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: !result ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "4px 8px",
              borderRadius: "5px",
              fontSize: "0.7rem",
              transition: "all 0.15s",
              opacity: !result ? 0.4 : 1,
            }}
            onMouseEnter={(e) => {
              if (result) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (result) e.currentTarget.style.background = "transparent";
            }}
          >
            {copied ? (
              <Check size={12} color="var(--accent-green)" />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* ─── Content Area ─── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          color: "#e6edf3",
        }}
      >
        {isExecuting ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--accent-blue)",
            }}
          >
            <div
              style={{
                width: "14px",
                height: "14px",
                border: "2px solid rgba(79,156,249,0.3)",
                borderTopColor: "#4f9cf9",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            Executing code...
          </div>
        ) : !result ? (
          <div
            style={{
              color: "var(--text-muted)",
              fontStyle: "italic",
              opacity: 0.6,
            }}
          >
            Run your code to see the output here...
          </div>
        ) : (
          <div
            className="animate-fade-in"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {result?.error ? (
              <pre
                style={{
                  fontFamily: "inherit",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  color: "var(--accent-red)",
                }}
              >
                {result.error}
              </pre>
            ) : (
              <>
                {result?.stderr && (
                  <pre
                    style={{
                      fontFamily: "inherit",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      color: "var(--accent-red)",
                    }}
                  >
                    {result.stderr}
                  </pre>
                )}
                {result?.stdout && (
                  <pre
                    style={{
                      fontFamily: "inherit",
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                    }}
                  >
                    {result.stdout}
                  </pre>
                )}
                {!result?.stderr && !result?.stdout && (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                      opacity: 0.6,
                    }}
                  >
                    (Program exited with no output)
                  </div>
                )}

                {result?.code !== null && result?.code !== undefined && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.7rem",
                      color:
                        result.code === 0
                          ? "var(--text-muted)"
                          : "var(--accent-red)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background:
                          result.code === 0
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    />
                    Process exited with code {result.code}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
