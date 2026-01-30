/**
 * Status-Anzeige Komponente
 * Zeigt aktuellen Status der App
 */

"use client";

type Status = "ready" | "recording" | "processing" | "done" | "error";

interface StatusBarProps {
  status: Status;
  message?: string;
  duration?: number;
}

const statusMessages: Record<Status, string> = {
  ready: "Bereit",
  recording: "Aufnahme",
  processing: "Verarbeitung...",
  done: "In Zwischenablage kopiert",
  error: "Fehler",
};

export function StatusBar({ status, message, duration }: StatusBarProps) {
  const displayMessage = message ?? statusMessages[status];
  const formattedDuration = duration
    ? `${Math.floor(duration / 60)
        .toString()
        .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`
    : null;

  return (
    <div className="flex items-center justify-between px-md py-sm border-t border-light-border dark:border-dark-border">
      <span className="text-label text-light-text-secondary dark:text-dark-text-secondary">
        {displayMessage}
        {formattedDuration && status === "recording" && ` ${formattedDuration}`}
      </span>
    </div>
  );
}
