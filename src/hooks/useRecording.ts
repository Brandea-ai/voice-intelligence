/**
 * Recording State Hook
 * Wird in Phase 3 implementiert
 */

import { useState } from "react";

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
  error: string | null;
}

export function useRecording() {
  const [state, setState] = useState<RecordingState>({
    isRecording: false,
    duration: 0,
    audioLevel: 0,
    error: null,
  });

  const startRecording = async () => {
    setState((prev) => ({ ...prev, isRecording: true, error: null }));
  };

  const stopRecording = async () => {
    setState((prev) => ({ ...prev, isRecording: false }));
  };

  return {
    ...state,
    startRecording,
    stopRecording,
  };
}
