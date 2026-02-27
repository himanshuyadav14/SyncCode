"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches React errors in children (e.g. Editor or Video failing on slow network)
 * and shows fallback UI instead of a blank screen.
 */
export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, errorInfo.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/** Fallback UI for when the Editor fails to load (e.g. slow network / Monaco chunk failed) */
export function EditorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
      }}
    >
      <p style={{ margin: 0, textAlign: "center" }}>
        The editor couldn’t load. This can happen on a slow connection.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-header)",
            color: "var(--accent-blue)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Fallback UI for when the Video call component fails to load */
export function VideoFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "200px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        padding: "24px",
        background: "var(--bg-primary)",
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
        borderRadius: "12px",
        border: "1px solid var(--border-muted)",
      }}
    >
      <p style={{ margin: 0, textAlign: "center" }}>
        Video call couldn’t load. Check your connection or try again.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border-default)",
            background: "var(--bg-header)",
            color: "var(--accent-blue)",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
