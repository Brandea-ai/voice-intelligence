"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { Mic, Copy, Minus, Pin, PinOff, X } from "lucide-react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useSettings } from "@/hooks/useSettings";
import {
  DeepgramStreamingClient,
  AudioStreamProcessor,
  getDeepgramApiKey,
} from "@/lib/deepgram";

interface VoiceCommandBarProps {
  onCopyAndClose?: (text: string) => void;
}

// Fenster-Konstanten
const MIN_WIDTH = 320;
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 600;
const IDLE_HEIGHT = 80;

// Hilfsfunktionen
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Tauri v2 Erkennung
const isTauri = (): boolean => {
  if (typeof window === "undefined") return false;
  // Tauri v2 verwendet __TAURI_INTERNALS__ oder isTauri
  return "__TAURI_INTERNALS__" in window || "isTauri" in window;
};

export function VoiceCommandBar({ onCopyAndClose }: VoiceCommandBarProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [resultText, setResultText] = useState("");
  const [liveText, setLiveText] = useState(""); // Live-Transkript während Aufnahme
  const [audioLevel, setAudioLevel] = useState(0);
  const [streamingError, setStreamingError] = useState<string | null>(null);

  const { settings, toggleAlwaysOnTop } = useSettings();

  // Deepgram Streaming Refs
  const deepgramClientRef = useRef<DeepgramStreamingClient | null>(null);
  const audioProcessorRef = useRef<AudioStreamProcessor | null>(null);
  const finalTranscriptRef = useRef<string>(""); // Akkumuliert finale Segmente
  const levelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Layout Refs für DOM-Messung
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const resultWrapRef = useRef<HTMLDivElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const actionsRef = useRef<HTMLDivElement | null>(null);

  // Animation Refs
  const currentHeightRef = useRef(IDLE_HEIGHT);

  const hasResult = !!resultText && !isRecording && !isProcessing;
  const hasLiveText = !!liveText && isRecording;

  // DEBUG: Zustandsänderungen loggen
  useEffect(() => {
    console.log("🔴 [STATE] isRecording:", isRecording);
  }, [isRecording]);

  useEffect(() => {
    console.log("⏳ [STATE] isProcessing:", isProcessing);
  }, [isProcessing]);

  useEffect(() => {
    console.log("📝 [STATE] resultText:", resultText ? resultText.substring(0, 50) + "..." : "(leer)");
  }, [resultText]);

  useEffect(() => {
    console.log("✅ [STATE] hasResult:", hasResult);
  }, [hasResult]);

  // Berechne benötigte Höhe aus DOM-Messung
  const measureHeight = useCallback((): number => {
    // Bei Live-Text während Aufnahme: Dynamische Höhe ohne Actions
    if (hasLiveText && !hasResult) {
      const header = headerRef.current;
      const liveTextEl = document.querySelector(".live-text-container");

      if (!header) return IDLE_HEIGHT;

      const rootPadding = 16;
      const panelPadding = 24;
      const panelGap = 12;
      const headerHeight = header.getBoundingClientRect().height;
      const liveTextHeight = liveTextEl ? liveTextEl.scrollHeight : 40;

      const totalHeight = rootPadding + panelPadding + headerHeight + panelGap + liveTextHeight;
      return Math.round(Math.min(totalHeight, MAX_HEIGHT));
    }

    if (!hasResult) return IDLE_HEIGHT;

    const root = rootRef.current;
    const panel = panelRef.current;
    const header = headerRef.current;
    const textContainer = textContainerRef.current;
    const actions = actionsRef.current;

    if (!root || !panel || !header || !textContainer || !actions) {
      console.log("[Measure] Refs nicht bereit");
      return IDLE_HEIGHT;
    }

    // Padding vom Root (p-2 = 8px * 2)
    const rootPadding = 16;

    // Padding vom Panel (py-3 = 12px * 2)
    const panelPadding = 24;

    // Gap im Panel (gap-3 = 12px)
    const panelGap = 12;

    // Header Höhe
    const headerHeight = header.getBoundingClientRect().height;

    // Text Scroll-Höhe (die volle Höhe des Inhalts)
    const textHeight = textContainer.scrollHeight;

    // Actions Höhe
    const actionsHeight = actions.getBoundingClientRect().height;

    // Gap im Result-Wrapper (gap-3 = 12px)
    const resultGap = 12;

    const totalHeight = rootPadding + panelPadding + headerHeight + panelGap + textHeight + resultGap + actionsHeight;

    console.log("[Measure] Header:", headerHeight, "Text:", textHeight, "Actions:", actionsHeight, "Total:", totalHeight);

    return Math.round(totalHeight);
  }, [hasResult, hasLiveText]);

  // Fenstergrößen-Änderung - direkter Aufruf ohne Workarounds
  const animateToHeight = useCallback(async (targetHeight: number) => {
    const target = clamp(targetHeight, MIN_HEIGHT, MAX_HEIGHT);

    if (!isTauri()) {
      console.log("[Window] Kein Tauri-Kontext");
      return;
    }

    console.log("[Window] animateToHeight aufgerufen mit:", target, "aktuell:", currentHeightRef.current);

    // Wenn bereits auf Ziel, nichts tun
    if (Math.abs(currentHeightRef.current - target) < 2) {
      console.log("[Window] Bereits auf Zielgröße");
      return;
    }

    currentHeightRef.current = target;

    try {
      const appWindow = getCurrentWindow();
      const size = new LogicalSize(MIN_WIDTH, target);

      console.log("[Window] Rufe setSize auf:", MIN_WIDTH, "x", target);
      await appWindow.setSize(size);

      // Verifiziere die neue Größe
      const newSize = await appWindow.innerSize();
      console.log("[Window] Neue innerSize:", newSize.width, "x", newSize.height);
    } catch (e) {
      console.error("[Window] setSize FEHLER:", e);
    }
  }, []);

  // Setze Fenstergröße direkt
  const setWindowHeight = useCallback(async (height: number) => {
    const target = clamp(height, MIN_HEIGHT, MAX_HEIGHT);
    currentHeightRef.current = target;

    if (!isTauri()) return;

    try {
      const appWindow = getCurrentWindow();
      console.log("[Window] setWindowHeight:", MIN_WIDTH, "x", target);
      await appWindow.setSize(new LogicalSize(MIN_WIDTH, target));
    } catch (e) {
      console.error("[Window] setWindowHeight FEHLER:", e);
    }
  }, []);

  // Layout-Effekt: Fenster an Inhalt anpassen
  useLayoutEffect(() => {
    const shouldResize = hasResult || hasLiveText;
    console.log("📐 [LAYOUT] useLayoutEffect triggered, hasResult:", hasResult, "hasLiveText:", hasLiveText);

    if (!shouldResize) {
      console.log("📐 [LAYOUT] Kein Resize nötig");
      return;
    }

    console.log("📐 [LAYOUT] Plane Resize...");

    // Warte einen Frame damit DOM gemessen werden kann
    const id = requestAnimationFrame(() => {
      console.log("📐 [LAYOUT] requestAnimationFrame callback");
      const neededHeight = measureHeight();
      console.log("📐 [LAYOUT] measureHeight() returned:", neededHeight);
      void animateToHeight(neededHeight);
    });

    return () => {
      console.log("📐 [LAYOUT] cleanup");
      cancelAnimationFrame(id);
    };
  }, [hasResult, hasLiveText, resultText, liveText, measureHeight, animateToHeight]);

  // Initial: Fenstergröße auf Idle setzen
  useEffect(() => {
    console.log("🚀 [INIT] Komponente geladen, isTauri():", isTauri());
    if (isTauri()) {
      console.log("🚀 [INIT] Setze IDLE_HEIGHT:", IDLE_HEIGHT);
      void setWindowHeight(IDLE_HEIGHT);
    }
  }, [setWindowHeight]);

  // Window Drag
  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".result-text")) return;
    getCurrentWindow().startDragging();
  }, []);

  // Minimize
  const handleMinimize = useCallback(async () => {
    try {
      await getCurrentWindow().minimize();
    } catch (e) {
      console.error("Minimieren fehlgeschlagen:", e);
    }
  }, []);

  // Zurück zur Idle-Größe
  const resetToIdle = useCallback(async () => {
    setResultText("");
    setLiveText("");
    setStreamingError(null);
    finalTranscriptRef.current = "";
    await animateToHeight(IDLE_HEIGHT);
  }, [animateToHeight]);

  // Start Recording mit Deepgram Streaming
  const startRecording = useCallback(async () => {
    const apiKey = getDeepgramApiKey();

    if (!apiKey) {
      console.error("[Deepgram] Kein API Key gefunden");
      setStreamingError("Kein Deepgram API Key konfiguriert");
      return;
    }

    try {
      // Reset State
      setIsRecording(true);
      setDuration(0);
      setResultText("");
      setLiveText("");
      setAudioLevel(0);
      setStreamingError(null);
      finalTranscriptRef.current = "";

      console.log("[Recording] Starte Deepgram Streaming...");

      // Deepgram Client erstellen
      const client = new DeepgramStreamingClient(
        { apiKey, language: "de" },
        {
          onTranscript: (result) => {
            if (result.isFinal) {
              // Final: Akkumuliere und zeige kompletten Text
              finalTranscriptRef.current += (finalTranscriptRef.current ? " " : "") + result.transcript;
              setLiveText(finalTranscriptRef.current);
              console.log("[Deepgram] Final akkumuliert:", finalTranscriptRef.current.substring(0, 50));
            } else {
              // Interim: Zeige bisherige Finals + aktuelles Interim
              const display = finalTranscriptRef.current
                ? finalTranscriptRef.current + " " + result.transcript
                : result.transcript;
              setLiveText(display);
            }
          },
          onError: (error) => {
            console.error("[Deepgram] Fehler:", error);
            setStreamingError(error.message);
          },
          onOpen: () => {
            console.log("[Deepgram] Verbindung hergestellt");
          },
          onClose: () => {
            console.log("[Deepgram] Verbindung geschlossen");
          },
        }
      );

      deepgramClientRef.current = client;

      // WebSocket verbinden
      await client.connect();

      // Audio Processor starten
      const processor = new AudioStreamProcessor();
      audioProcessorRef.current = processor;

      await processor.start((audioData) => {
        client.sendAudio(audioData);
      });

      // Audio-Level für visuelle Anzeige
      levelIntervalRef.current = setInterval(() => {
        if (audioProcessorRef.current) {
          const level = audioProcessorRef.current.getAudioLevel();
          setAudioLevel(level);
        }
      }, 50);

      console.log("[Recording] Deepgram Streaming aktiv");
    } catch (error) {
      console.error("[Recording] Fehler beim Start:", error);
      setStreamingError(error instanceof Error ? error.message : "Unbekannter Fehler");
      setIsRecording(false);

      // Cleanup bei Fehler
      if (deepgramClientRef.current) {
        await deepgramClientRef.current.disconnect();
        deepgramClientRef.current = null;
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current.stop();
        audioProcessorRef.current = null;
      }
    }
  }, []);

  // Stop Recording - Beendet Deepgram Streaming
  const stopRecording = useCallback(async () => {
    console.log("🛑 [STOP] stopRecording aufgerufen");

    // Level-Interval stoppen
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }
    setAudioLevel(0);

    console.log("🛑 [STOP] setIsRecording(false), setIsProcessing(true)");
    setIsRecording(false);
    setIsProcessing(true);

    // Fenster etwas vergrößern für finale Verarbeitung
    await setWindowHeight(120);

    // Audio Processor stoppen
    if (audioProcessorRef.current) {
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }

    // Deepgram Verbindung trennen (wartet auf letzte Nachrichten)
    if (deepgramClientRef.current) {
      await deepgramClientRef.current.disconnect();
      deepgramClientRef.current = null;
    }

    // Finale Transkription verwenden
    const finalText = finalTranscriptRef.current.trim();
    console.log("🎤 [STT] Finale Transkription:", finalText ? finalText.substring(0, 50) + "..." : "(leer)");

    if (finalText) {
      setResultText(finalText);
    } else if (liveText.trim()) {
      // Falls keine Finals aber Interim-Text vorhanden
      setResultText(liveText.trim());
    } else {
      setResultText("Keine Sprache erkannt. Bitte erneut versuchen.");
    }

    // Reset Live-Text
    setLiveText("");
    finalTranscriptRef.current = "";

    console.log("🛑 [STOP] setIsProcessing(false)");
    setIsProcessing(false);
    console.log("🛑 [STOP] stopRecording fertig");
  }, [setWindowHeight, liveText]);

  const cancelRecording = useCallback(async () => {
    if (levelIntervalRef.current) {
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = null;
    }

    // Deepgram Cleanup
    if (audioProcessorRef.current) {
      audioProcessorRef.current.stop();
      audioProcessorRef.current = null;
    }
    if (deepgramClientRef.current) {
      await deepgramClientRef.current.disconnect();
      deepgramClientRef.current = null;
    }

    // State Reset
    setIsRecording(false);
    setIsProcessing(false);
    setResultText("");
    setLiveText("");
    setAudioLevel(0);
    setStreamingError(null);
    finalTranscriptRef.current = "";

    await animateToHeight(IDLE_HEIGHT);
  }, [animateToHeight]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  // Timer (kein Limit mehr, Deepgram Streaming ist unbegrenzt)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        toggleRecording();
        return;
      }
      if (e.code === "Escape") {
        if (isRecording) {
          e.preventDefault();
          e.stopPropagation();
          void cancelRecording();
          return;
        }
        if (isProcessing || resultText) {
          e.preventDefault();
          e.stopPropagation();
          setIsProcessing(false);
          void resetToIdle();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isRecording, isProcessing, resultText, toggleRecording, cancelRecording, resetToIdle]);

  const handleCopyAndClose = async () => {
    await navigator.clipboard.writeText(resultText);
    onCopyAndClose?.(resultText);
    await resetToIdle();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Berechne max-height für Text-Container
  const textMaxHeight = MAX_HEIGHT - 160; // Platz für Header + Actions + Padding

  return (
    <div ref={rootRef} className="w-full h-full relative p-2 group" onMouseDown={handleDrag}>
      {/* Control Buttons */}
      <div className="absolute top-0 left-0 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <button
          onClick={handleMinimize}
          className="w-5 h-5 rounded-full bg-[var(--control-bg)] flex items-center justify-center no-drag opacity-70 hover:opacity-100 transition-all"
          title="Minimieren"
        >
          <Minus className="w-3 h-3 text-white" />
        </button>

        <button
          onClick={toggleAlwaysOnTop}
          className={`w-5 h-5 rounded-full flex items-center justify-center no-drag transition-all ${
            settings.alwaysOnTop
              ? "bg-blue-500/80 opacity-100"
              : "bg-[var(--control-bg)] opacity-70 hover:opacity-100"
          }`}
          title={settings.alwaysOnTop ? "Immer im Vordergrund: An" : "Immer im Vordergrund: Aus"}
        >
          {settings.alwaysOnTop ? (
            <Pin className="w-3 h-3 text-white" />
          ) : (
            <PinOff className="w-3 h-3 text-white/60" />
          )}
        </button>
      </div>

      {/* Close Button */}
      {hasResult && (
        <button
          onClick={resetToIdle}
          className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[var(--control-bg)] flex items-center justify-center no-drag opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all z-20"
          title="Schließen (Esc)"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      )}

      {/* Main Panel */}
      <div ref={panelRef} className="glass-panel w-full h-full flex flex-col gap-3 px-4 py-3 relative">
        {/* Header */}
        <div ref={headerRef} className="flex items-center gap-3 flex-shrink-0">
          {/* Mic Button */}
          <div className="relative flex-shrink-0">
            {isRecording && audioLevel > 5 && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  transform: `scale(${1 + audioLevel / 100})`,
                  opacity: Math.min(0.6, audioLevel / 100),
                  background: "var(--icon-recording)",
                  filter: "blur(8px)",
                  transition: "transform 0.1s ease-out, opacity 0.1s ease-out",
                }}
              />
            )}
            <button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`w-10 h-10 rounded-full flex items-center justify-center no-drag transition-all relative z-10 ${
                isRecording
                  ? "bg-[var(--red-light)] border border-[var(--red-border)]"
                  : "bg-[var(--bg-element)] border border-[var(--border-element)] hover:bg-[var(--bg-element-hover)]"
              } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Mic
                className="w-5 h-5 transition-colors"
                style={{ color: isRecording ? "var(--icon-recording)" : "var(--icon-primary)" }}
              />
            </button>
          </div>

          {/* Status / Hint */}
          <div className="flex-1 min-w-0">
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[var(--text-secondary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Finalisiere...
                </span>
              </div>
            ) : isRecording && !hasLiveText ? (
              <div className="flex flex-col gap-0.5">
                <span
                  className="font-mono text-sm"
                  style={{ color: "var(--icon-recording)" }}
                >
                  {formatTime(duration)}
                </span>
                {streamingError ? (
                  <span className="text-xs text-red-500">{streamingError}</span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-hint)" }}>
                    Spreche jetzt...
                  </span>
                )}
              </div>
            ) : isRecording && hasLiveText ? (
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-xs"
                  style={{ color: "var(--icon-recording)" }}
                >
                  {formatTime(duration)}
                </span>
              </div>
            ) : !hasResult ? (
              <span className="text-sm" style={{ color: "var(--text-hint)" }}>
                Klicken oder Leertaste drücken
              </span>
            ) : null}
          </div>
        </div>

        {/* Live-Transkript während Aufnahme (Teleprompter-Effekt) */}
        {hasLiveText && (
          <div
            className="live-text-container text-sm leading-relaxed overflow-y-auto"
            style={{
              color: "var(--text-primary)",
              maxHeight: textMaxHeight,
              opacity: 0.9,
            }}
          >
            {liveText}
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
          </div>
        )}

        {/* Result Area */}
        {hasResult && (
          <div ref={resultWrapRef} className="flex-1 flex flex-col gap-3 min-h-0">
            <div
              ref={textContainerRef}
              className="result-text overflow-y-auto text-sm leading-relaxed"
              style={{
                color: "var(--text-primary)",
                maxHeight: textMaxHeight,
              }}
            >
              {resultText}
            </div>

            {/* Action Buttons */}
            <div ref={actionsRef} className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleCopyAndClose}
                className="primary-button no-drag flex-1 justify-center"
              >
                <Copy className="w-4 h-4" />
                <span>Kopieren & Schließen</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
