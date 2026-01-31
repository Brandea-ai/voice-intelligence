"use client";

type Status = "ready" | "recording" | "processing" | "done" | "error";

interface StatusBarProps {
  status: Status;
  message?: string;
  duration?: number;
}

const statusConfig: Record<Status, { text: string; color: string }> = {
  ready: { text: "Bereit", color: "text-[var(--text-secondary)]" },
  recording: { text: "Aufnahme", color: "text-red-400" },
  processing: { text: "Verarbeitung...", color: "text-[var(--accent)]" },
  done: { text: "Kopiert", color: "text-green-400" },
  error: { text: "Fehler", color: "text-red-400" },
};

export function StatusBar({ status, message, duration }: StatusBarProps) {
  const config = statusConfig[status];
  const displayMessage = message ?? config.text;

  const formattedDuration =
    duration !== undefined
      ? `${Math.floor(duration / 60)
          .toString()
          .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`
      : null;

  return (
    <div className="status-bar mx-4 mb-3 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            status === "recording"
              ? "bg-red-400 animate-pulse"
              : status === "done"
              ? "bg-green-400"
              : status === "processing"
              ? "bg-[var(--accent)]"
              : "bg-[var(--text-secondary)]"
          }`}
        />
        <span className={`text-xs font-medium ${config.color}`}>
          {displayMessage}
        </span>
      </div>

      {formattedDuration && status === "recording" && (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {formattedDuration}
        </span>
      )}
    </div>
  );
}
