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
      <div className="glass-card p-5 fade-in">
        <div className="space-y-3">
          <div className="h-4 rounded-full shimmer w-4/5" />
          <div className="h-4 rounded-full shimmer w-3/5" />
          <div className="h-4 rounded-full shimmer w-2/5" />
        </div>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="glass-card p-5 fade-in">
      <p className="text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
