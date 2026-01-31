/**
 * Audio Recording Utilities
 * Phase 3: Voice Recording
 *
 * Enthält Hilfsfunktionen für Audio-Aufnahme und -Konvertierung.
 * Die Deepgram-Integration nutzt AudioStreamProcessor aus deepgram.ts.
 * Diese Utilities bleiben für alternative Anwendungsfälle erhalten.
 */

export interface AudioRecorderState {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

export interface AudioRecorderResult {
  blob: Blob;
  duration: number;
  mimeType: string;
}

/**
 * Prüft verfügbare Audio-MimeTypes und gibt den besten zurück
 */
export function getSupportedMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "audio/webm";
}

/**
 * Berechnet Audio-Pegel aus AnalyserNode (0-100)
 */
export function calculateAudioLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  const sum = dataArray.reduce((acc, val) => acc + val, 0);
  const average = sum / dataArray.length;

  return Math.min(100, Math.round((average / 255) * 100 * 1.5));
}

/**
 * Erstellt einen MediaRecorder mit dem Mikrofon-Stream
 */
export async function createRecorder(stream: MediaStream): Promise<MediaRecorder> {
  const mimeType = getSupportedMimeType();

  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 128000,
  });

  return recorder;
}

/**
 * Sammelt Audio-Chunks und gibt Blob zurück wenn Recording stoppt
 */
export function collectAudioChunks(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });
      resolve(blob);
    };

    recorder.onerror = (event) => {
      reject(new Error(`MediaRecorder Fehler: ${event}`));
    };
  });
}

/**
 * Konvertiert Audio-Blob zu LINEAR16 (PCM)
 *
 * Nützlich für APIs die unkomprimiertes Audio erwarten.
 * LINEAR16 hat keine Container-Metadaten, Dauer wird aus Samples berechnet.
 *
 * @param audioBlob - Original Audio (WebM, Opus, etc.)
 * @param targetSampleRate - Ziel Sample Rate (default: 16000 Hz)
 * @returns LINEAR16 Audio als Blob
 */
export async function convertToLinear16(
  audioBlob: Blob,
  targetSampleRate: number = 16000
): Promise<Blob> {
  console.log("[Audio] Konvertiere zu LINEAR16...");
  console.log("[Audio]   - Input Größe:", (audioBlob.size / 1024).toFixed(2), "KB");
  console.log("[Audio]   - Input Typ:", audioBlob.type);

  // Audio dekodieren mit Web Audio API
  const audioContext = new AudioContext({ sampleRate: targetSampleRate });

  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    console.log("[Audio]   - Decoded Duration:", audioBuffer.duration.toFixed(2), "s");
    console.log("[Audio]   - Decoded Sample Rate:", audioBuffer.sampleRate, "Hz");
    console.log("[Audio]   - Decoded Channels:", audioBuffer.numberOfChannels);

    // Zu Mono konvertieren (falls Stereo)
    const monoData = audioBuffer.numberOfChannels > 1
      ? mixToMono(audioBuffer)
      : audioBuffer.getChannelData(0);

    // Resample falls nötig
    let finalData = monoData;
    if (audioBuffer.sampleRate !== targetSampleRate) {
      console.log("[Audio]   - Resampling:", audioBuffer.sampleRate, "→", targetSampleRate, "Hz");
      finalData = resample(monoData, audioBuffer.sampleRate, targetSampleRate);
    }

    // Float32 zu Int16 konvertieren (LINEAR16)
    const int16Data = float32ToInt16(finalData);

    // Als Blob zurückgeben
    const outputBlob = new Blob([int16Data.buffer], { type: "audio/l16" });

    console.log("[Audio]   - Output Größe:", (outputBlob.size / 1024).toFixed(2), "KB");
    console.log("[Audio]   - Output Samples:", int16Data.length);
    console.log("[Audio]   - Output Dauer:", (int16Data.length / targetSampleRate).toFixed(2), "s");
    console.log("[Audio] Konvertierung abgeschlossen");

    return outputBlob;
  } finally {
    await audioContext.close();
  }
}

/**
 * Mischt Stereo zu Mono
 */
function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const left = audioBuffer.getChannelData(0);
  const right = audioBuffer.getChannelData(1);
  const mono = new Float32Array(left.length);

  for (let i = 0; i < left.length; i++) {
    mono[i] = (left[i] + right[i]) / 2;
  }

  return mono;
}

/**
 * Einfaches Resampling (Linear Interpolation)
 */
function resample(
  data: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  const ratio = fromRate / toRate;
  const newLength = Math.round(data.length / ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, data.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    result[i] = data[srcIndexFloor] * (1 - fraction) + data[srcIndexCeil] * fraction;
  }

  return result;
}

/**
 * Konvertiert Float32 (-1 bis 1) zu Int16 (-32768 bis 32767)
 */
function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);

  for (let i = 0; i < float32Array.length; i++) {
    // Clamp zwischen -1 und 1
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    // Skaliere zu Int16
    int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return int16Array;
}

/**
 * Konvertiert Blob zu ArrayBuffer (für API-Calls)
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return await blob.arrayBuffer();
}

/**
 * Konvertiert Blob zu Base64 (für API-Calls)
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1] ?? "";
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
