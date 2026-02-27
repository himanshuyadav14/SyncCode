"use client";

interface ToastProps {
  message: string;
  icon?: string;
  type?: "success" | "info";
}

export default function Toast({
  message,
  icon = "✓",
  type = "info",
}: ToastProps) {
  return (
    <div className="toast-container">
      <div className={`toast toast--${type} toast-in`}>
        <span style={{ fontSize: "0.95rem" }}>{icon}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
