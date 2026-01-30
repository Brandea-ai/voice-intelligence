/**
 * Aufnahme-Steuerung Komponente
 * Wird in Phase 3 implementiert
 */

"use client";

interface RecordButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function RecordButton({
  isRecording,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  return (
    <button
      type="button"
      onClick={isRecording ? onStop : onStart}
      disabled={disabled}
      className="w-20 h-20 rounded-full flex items-center justify-center transition-all
        bg-light-bg-secondary dark:bg-dark-bg-secondary
        hover:bg-light-border dark:hover:bg-dark-border
        disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
    >
      <span
        className={`w-8 h-8 rounded-full transition-all ${
          isRecording ? "bg-red-500 animate-pulse" : "bg-light-accent dark:bg-dark-accent"
        }`}
      />
    </button>
  );
}
