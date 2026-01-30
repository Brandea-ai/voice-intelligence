"use client";

import { useState, useEffect, useCallback } from "react";
import { RecordButton } from "@/components/RecordButton";
import { TranscriptDisplay } from "@/components/TranscriptDisplay";
import { StatusBar } from "@/components/StatusBar";
import { useWindow } from "@/hooks/useWindow";

type AppState = "ready" | "recording" | "processing" | "done" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("ready");
  const [transcript, setTranscript] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);

  // Window-Steuerung (Escape zum Verstecken)
  useWindow();

  const handleStartRecording = useCallback(() => {
    setState("recording");
    setTranscript("");
    setDuration(0);
  }, []);

  const handleStopRecording = useCallback(() => {
    setState("processing");
    setTimeout(() => {
      setTranscript(
        "Dies ist ein Platzhalter-Text.\n\nDie Aufnahme- und Transkriptions-Funktion wird in Phase 3 und 4 implementiert."
      );
      setState("done");
    }, 1500);
  }, []);

  // Leertaste für Aufnahme starten/stoppen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" && event.target === document.body) {
        event.preventDefault();
        if (state === "ready" || state === "done") {
          handleStartRecording();
        } else if (state === "recording") {
          handleStopRecording();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, handleStartRecording, handleStopRecording]);

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] select-none">
      {/* Hauptbereich */}
      <main className="flex-1 flex flex-col items-center justify-center p-lg">
        {/* Record Button */}
        <div className="mb-lg">
          <RecordButton
            isRecording={state === "recording"}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            disabled={state === "processing"}
          />
        </div>

        {/* Hinweis-Text */}
        <p className="text-label text-[var(--text-secondary)] mb-lg text-center">
          {state === "ready" && "Klicken oder Leertaste"}
          {state === "recording" && "Aufnahme... (Leertaste zum Stoppen)"}
          {state === "processing" && "Verarbeitung..."}
          {state === "done" && "Bereit zum Einfügen (Cmd+V)"}
        </p>

        {/* Transkript-Anzeige */}
        {(state === "processing" || state === "done") && (
          <div className="w-full max-w-sm">
            <TranscriptDisplay
              text={transcript}
              isLoading={state === "processing"}
            />
          </div>
        )}
      </main>

      {/* Status-Leiste */}
      <StatusBar status={state} duration={duration} />

      {/* Tastaturkürzel-Hinweis */}
      <div className="text-center pb-sm">
        <span className="text-label text-[var(--text-secondary)] opacity-50">
          Esc zum Verstecken
        </span>
      </div>
    </div>
  );
}
