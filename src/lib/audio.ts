/**
 * Audio Recording Utilities
 * Wird in Phase 3 implementiert
 */

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

export async function startRecording(): Promise<MediaRecorder> {
  throw new Error("Nicht implementiert - Phase 3");
}

export async function stopRecording(
  _recorder: MediaRecorder
): Promise<ArrayBuffer> {
  throw new Error("Nicht implementiert - Phase 3");
}
