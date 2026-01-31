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
    <div className="relative no-drag">
      {/* Pulse Ringe bei Aufnahme */}
      {isRecording && (
        <>
          <div className="pulse-outer" />
          <div className="pulse-outer pulse-outer-delayed" />
        </>
      )}

      {/* Premium Button */}
      <button
        type="button"
        onClick={isRecording ? onStop : onStart}
        disabled={disabled}
        className={`
          record-button flex items-center justify-center
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording ? "recording" : ""}
        `}
        aria-label={isRecording ? "Aufnahme stoppen" : "Aufnahme starten"}
      >
        {/* Inneres Icon */}
        <span className={`record-icon ${isRecording ? "recording" : ""}`} />
      </button>
    </div>
  );
}
