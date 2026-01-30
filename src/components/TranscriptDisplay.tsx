/**
 * Transkript-Anzeige Komponente
 * Wird in Phase 4 implementiert
 */

"use client";

interface TranscriptDisplayProps {
  text: string;
  isLoading?: boolean;
}

export function TranscriptDisplay({
  text,
  isLoading = false,
}: TranscriptDisplayProps) {
  if (isLoading) {
    return (
      <div className="p-md rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-3/4" />
          <div className="h-4 bg-light-border dark:bg-dark-border rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="p-md rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary">
      <p className="text-body text-light-text-primary dark:text-dark-text-primary whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
