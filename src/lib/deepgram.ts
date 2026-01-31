/**
 * Deepgram Nova-3 WebSocket Streaming Client
 * Phase 4.5: Live Speech-to-Text mit Echtzeit-Transkription
 *
 * Features:
 * - Sub-300ms Latenz
 * - Interim Results (Live-Text während Sprechen)
 * - Final Results (Korrigierter Text am Ende)
 * - Deutsch & Englisch Unterstützung
 * - WebSocket-basiertes Streaming
 */

export interface DeepgramConfig {
  apiKey: string;
  language?: string; // "de" für Deutsch, "en" für Englisch
  model?: string; // "nova-3" (Standard, beste Qualität)
  sampleRate?: number;
  channels?: number;
  encoding?: string;
  punctuate?: boolean;
  interimResults?: boolean;
  smartFormat?: boolean;
  numerals?: boolean; // Zahlen als Ziffern statt Wörter (z.B. "15" statt "fünfzehn")
  keyterm?: string[]; // Keyterm Prompting für bessere Erkennung (offizieller Parameter-Name)
}

export interface DeepgramTranscriptResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export interface DeepgramCallbacks {
  onTranscript: (result: DeepgramTranscriptResult) => void;
  onError: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Deutsche Zahlwörter zu Ziffern Mapping
 */
const GERMAN_ONES: Record<string, number> = {
  null: 0, eins: 1, ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4,
  fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
  elf: 11, zwölf: 12, dreizehn: 13, vierzehn: 14, fünfzehn: 15,
  sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19,
};

const GERMAN_TENS: Record<string, number> = {
  zwanzig: 20, dreißig: 30, dreissig: 30, vierzig: 40, fünfzig: 50,
  sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90,
};

const GERMAN_HUNDREDS: Record<string, number> = {
  einhundert: 100, zweihundert: 200, dreihundert: 300, vierhundert: 400,
  fünfhundert: 500, sechshundert: 600, siebenhundert: 700, achthundert: 800,
  neunhundert: 900, hundert: 100,
};

const GERMAN_YEARS_PREFIX: Record<string, number> = {
  neunzehnhundert: 1900,
  achtzehnhundert: 1800,
  siebzehnhundert: 1700,
  sechzehnhundert: 1600,
  zweitausend: 2000,
  einundzwanzighundert: 2100,
};

/**
 * Deutsche Ordinalzahlen (erste, zweite, dritte...)
 * Alle Formen: erste/erster/ersten/erstem, zweite/zweiter/zweiten/zweitem, etc.
 */
const GERMAN_ORDINALS: Record<string, number> = {
  // 1-19
  erst: 1, erste: 1, erster: 1, ersten: 1, erstem: 1, erstes: 1,
  zweit: 2, zweite: 2, zweiter: 2, zweiten: 2, zweitem: 2, zweites: 2,
  dritt: 3, dritte: 3, dritter: 3, dritten: 3, drittem: 3, drittes: 3,
  viert: 4, vierte: 4, vierter: 4, vierten: 4, viertem: 4, viertes: 4,
  fünft: 5, fünfte: 5, fünfter: 5, fünften: 5, fünftem: 5, fünftes: 5,
  sechst: 6, sechste: 6, sechster: 6, sechsten: 6, sechstem: 6, sechstes: 6,
  siebte: 7, siebter: 7, siebten: 7, siebtem: 7, siebtes: 7, siebt: 7,
  acht: 8, achte: 8, achter: 8, achten: 8, achtem: 8, achtes: 8,
  neunte: 9, neunter: 9, neunten: 9, neuntem: 9, neuntes: 9, neunt: 9,
  zehnte: 10, zehnter: 10, zehnten: 10, zehntem: 10, zehntes: 10, zehnt: 10,
  elfte: 11, elfter: 11, elften: 11, elftem: 11, elftes: 11, elft: 11,
  zwölfte: 12, zwölfter: 12, zwölften: 12, zwölftem: 12, zwölftes: 12, zwölft: 12,
  dreizehnte: 13, dreizehnter: 13, dreizehnten: 13, dreizehntem: 13, dreizehntes: 13,
  vierzehnte: 14, vierzehnter: 14, vierzehnten: 14, vierzehntem: 14, vierzehntes: 14,
  fünfzehnte: 15, fünfzehnter: 15, fünfzehnten: 15, fünfzehntem: 15, fünfzehntes: 15,
  sechzehnte: 16, sechzehnter: 16, sechzehnten: 16, sechzehntem: 16, sechzehntes: 16,
  siebzehnte: 17, siebzehnter: 17, siebzehnten: 17, siebzehntem: 17, siebzehntes: 17,
  achtzehnte: 18, achtzehnter: 18, achtzehnten: 18, achtzehntem: 18, achtzehntes: 18,
  neunzehnte: 19, neunzehnter: 19, neunzehnten: 19, neunzehntem: 19, neunzehntes: 19,
  // 20-31 (wichtig für Tage)
  zwanzigste: 20, zwanzigster: 20, zwanzigsten: 20, zwanzigstem: 20, zwanzigstes: 20,
  einundzwanzigste: 21, einundzwanzigster: 21, einundzwanzigsten: 21,
  zweiundzwanzigste: 22, zweiundzwanzigster: 22, zweiundzwanzigsten: 22,
  dreiundzwanzigste: 23, dreiundzwanzigster: 23, dreiundzwanzigsten: 23,
  vierundzwanzigste: 24, vierundzwanzigster: 24, vierundzwanzigsten: 24,
  fünfundzwanzigste: 25, fünfundzwanzigster: 25, fünfundzwanzigsten: 25,
  sechsundzwanzigste: 26, sechsundzwanzigster: 26, sechsundzwanzigsten: 26,
  siebenundzwanzigste: 27, siebenundzwanzigster: 27, siebenundzwanzigsten: 27,
  achtundzwanzigste: 28, achtundzwanzigster: 28, achtundzwanzigsten: 28,
  neunundzwanzigste: 29, neunundzwanzigster: 29, neunundzwanzigsten: 29,
  dreißigste: 30, dreißigster: 30, dreißigsten: 30, dreissigstem: 30,
  einunddreißigste: 31, einunddreißigster: 31, einunddreißigsten: 31,
};

/**
 * Deutsche Monatsnamen zu Ziffern
 */
const GERMAN_MONTHS: Record<string, number> = {
  januar: 1, jänner: 1, jan: 1,
  februar: 2, feb: 2,
  märz: 3, maerz: 3, mar: 3,
  april: 4, apr: 4,
  mai: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  dezember: 12, dez: 12,
};

/**
 * Konvertiert deutsche Zahlwörter (0-99) zu Ziffern
 * z.B. "vierundachtzig" → 84, "sechsundneunzig" → 96
 */
function parseGermanNumber(word: string): number | null {
  const lower = word.toLowerCase();

  // Direkte Treffer (0-19)
  if (GERMAN_ONES[lower] !== undefined) {
    return GERMAN_ONES[lower];
  }

  // Zehner ohne Einer (20, 30, etc.)
  if (GERMAN_TENS[lower] !== undefined) {
    return GERMAN_TENS[lower];
  }

  // Zusammengesetzte Zahlen: "vierundachtzig" = vier + und + achtzig
  const match = lower.match(/^(\w+)und(\w+)$/);
  if (match) {
    const ones = GERMAN_ONES[match[1]];
    const tens = GERMAN_TENS[match[2]];
    if (ones !== undefined && tens !== undefined) {
      return tens + ones;
    }
  }

  return null;
}

/**
 * Konvertiert deutsche Ordinalzahl zu Ziffer
 * z.B. "zweite" → 2, "vierzehnten" → 14
 */
function parseGermanOrdinal(word: string): number | null {
  const lower = word.toLowerCase();
  return GERMAN_ORDINALS[lower] ?? null;
}

/**
 * Konvertiert deutschen Monatsnamen zu Ziffer
 * z.B. "August" → 8, "Februar" → 2
 */
function parseGermanMonth(word: string): number | null {
  const lower = word.toLowerCase();
  return GERMAN_MONTHS[lower] ?? null;
}

/**
 * Findet und parst eine Ordinalzahl am Anfang eines Strings
 * Gibt [Zahl, verbleibender String] zurück oder null
 */
function extractOrdinal(text: string): [number, string] | null {
  const lower = text.toLowerCase();

  // Sortiere nach Länge (längste zuerst) um "dreizehnten" vor "drei" zu matchen
  const sortedOrdinals = Object.keys(GERMAN_ORDINALS)
    .sort((a, b) => b.length - a.length);

  for (const word of sortedOrdinals) {
    if (lower.startsWith(word)) {
      const num = GERMAN_ORDINALS[word];
      const remaining = text.slice(word.length);
      return [num, remaining];
    }
  }
  return null;
}

/**
 * Findet und parst einen Monatsnamen am Anfang eines Strings
 * Gibt [Monatszahl, verbleibender String] zurück oder null
 */
function extractMonth(text: string): [number, string] | null {
  const lower = text.toLowerCase();

  const sortedMonths = Object.keys(GERMAN_MONTHS)
    .sort((a, b) => b.length - a.length);

  for (const word of sortedMonths) {
    if (lower.startsWith(word)) {
      const num = GERMAN_MONTHS[word];
      const remaining = text.slice(word.length);
      return [num, remaining];
    }
  }
  return null;
}

/**
 * Konvertiert gesprochene Datumsangaben in das Format TT.MM.JJJJ
 * Unterstützt:
 * - "der zweite vierte 1996" → "02.04.1996"
 * - "fünftenachten 1998" → "05.08.1998" (zusammengeschrieben)
 * - "am ersten Februar" → "01.02."
 * - "Seit dritten zweiten 1996" → "Seit 03.02.1996"
 */
function convertGermanDates(text: string): string {
  let result = text;

  // Pattern für Präfixe die vor Daten stehen können
  const prefixes = ["seit", "am", "vom", "den", "der", "ab", "bis", "im"];

  // Sortierte Ordinal-Keys für Regex (längste zuerst)
  const ordinalKeys = Object.keys(GERMAN_ORDINALS)
    .sort((a, b) => b.length - a.length);
  const monthKeys = Object.keys(GERMAN_MONTHS)
    .sort((a, b) => b.length - a.length);

  // Pattern 1: Präfix + Ordinal + (Ordinal|Monat) + Jahr?
  // z.B. "Seit dritten zweiten 1996", "den fünften achten 2026"
  const prefixPattern = new RegExp(
    `\\b(${prefixes.join("|")})\\s*(${ordinalKeys.join("|")})\\s*(${ordinalKeys.join("|")}|${monthKeys.join("|")})\\s*(\\d{4})?`,
    "gi"
  );

  result = result.replace(prefixPattern, (match, prefix, dayWord, monthWord, year) => {
    const dayNum = GERMAN_ORDINALS[dayWord.toLowerCase()];
    let monthNum = GERMAN_ORDINALS[monthWord.toLowerCase()] || GERMAN_MONTHS[monthWord.toLowerCase()];

    if (!dayNum || !monthNum) return match;

    const d = String(dayNum).padStart(2, "0");
    const m = String(monthNum).padStart(2, "0");
    const capitalPrefix = prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();

    if (year) {
      return `${capitalPrefix} ${d}.${m}.${year}`;
    }
    return `${capitalPrefix} ${d}.${m}.`;
  });

  // Pattern 2: Zusammengeschriebene Ordinalzahlen (fünftenachten1998)
  // Scanne durch den Text und suche nach Ordinal+Ordinal Kombinationen
  const words = result.split(/(\s+)/);
  const newWords: string[] = [];

  for (const word of words) {
    if (/^\s+$/.test(word)) {
      newWords.push(word);
      continue;
    }

    // Versuche Ordinal+Ordinal+Jahr zu extrahieren
    const extracted = extractOrdinal(word);
    if (extracted) {
      const [day, afterDay] = extracted;

      // Versuche zweite Ordinalzahl oder Monat
      const extracted2 = extractOrdinal(afterDay) || extractMonth(afterDay);
      if (extracted2) {
        const [month, afterMonth] = extracted2;

        // Prüfe auf Jahr
        const yearMatch = afterMonth.match(/^(\d{4})(.*)$/);
        const d = String(day).padStart(2, "0");
        const m = String(month).padStart(2, "0");

        if (yearMatch) {
          newWords.push(`${d}.${m}.${yearMatch[1]}${yearMatch[2]}`);
        } else if (afterMonth === "" || /^[.,!?\s]/.test(afterMonth)) {
          newWords.push(`${d}.${m}.${afterMonth}`);
        } else {
          // Konnte nicht vollständig parsen, Original behalten
          newWords.push(word);
        }
        continue;
      }
    }

    newWords.push(word);
  }

  result = newWords.join("");

  // Pattern 3: Ordinal + Monat (ohne Präfix)
  // z.B. "vierzehnten August" → "14.08."
  const ordinalMonthPattern = new RegExp(
    `\\b(${ordinalKeys.join("|")})\\s+(${monthKeys.join("|")})\\b`,
    "gi"
  );

  result = result.replace(ordinalMonthPattern, (match, ordinal, month) => {
    const dayNum = GERMAN_ORDINALS[ordinal.toLowerCase()];
    const monthNum = GERMAN_MONTHS[month.toLowerCase()];
    if (dayNum && monthNum) {
      return `${String(dayNum).padStart(2, "0")}.${String(monthNum).padStart(2, "0")}.`;
    }
    return match;
  });

  return result;
}

/**
 * Konvertiert deutsche Jahreszahlen als Wörter zu Ziffern
 * z.B. "neunzehnhundertvierundachtzig" → "1984"
 * z.B. "zweitausendzweiundzwanzig" → "2022"
 */
function convertGermanYearWords(text: string): string {
  let result = text;

  // Pattern für deutsche Jahreszahlen
  for (const [prefix, baseYear] of Object.entries(GERMAN_YEARS_PREFIX)) {
    // Regex für: prefix + optionale Zahl (z.B. "neunzehnhundertvierundachtzig")
    const regex = new RegExp(`\\b${prefix}(\\w*)\\b`, "gi");

    result = result.replace(regex, (match, suffix) => {
      if (!suffix) {
        return String(baseYear);
      }

      const suffixLower = suffix.toLowerCase();

      // Versuche direkte Zahl zu parsen (1-99)
      const directNumber = parseGermanNumber(suffixLower);
      if (directNumber !== null) {
        return String(baseYear + directNumber);
      }

      // Für 2000er Jahre: könnte "hundert" enthalten
      // z.B. "zweitausendeinhundert" = 2100
      for (const [hundredWord, hundredValue] of Object.entries(GERMAN_HUNDREDS)) {
        if (suffixLower.startsWith(hundredWord)) {
          const remaining = suffixLower.slice(hundredWord.length);
          if (!remaining) {
            return String(baseYear + hundredValue);
          }
          const remainingNumber = parseGermanNumber(remaining);
          if (remainingNumber !== null) {
            return String(baseYear + hundredValue + remainingNumber);
          }
        }
      }

      // Konnte nicht geparst werden, Original zurückgeben
      return match;
    });
  }

  return result;
}

const DEFAULT_CONFIG: Partial<DeepgramConfig> = {
  language: "de", // Deutsch als Standard
  model: "nova-3", // Beste Qualität, niedrigste Latenz
  sampleRate: 16000,
  channels: 1,
  encoding: "linear16",
  punctuate: true,
  interimResults: true,
  smartFormat: true,
  numerals: true, // Zahlen als Ziffern (14 statt vierzehn)
  keyterm: ["Brandea", "Everlast AI", "Armend"], // Keyterm Prompting (offizieller Name)
};

/**
 * Formatiert deutsche Zeitangaben und Daten
 * "14 Uhr 15" → "14:15"
 * "3. 2. 1996" → "03.02.1996"
 * "neunzehnhundertvierundachtzig" → "1984"
 * "der zweite vierte 1996" → "02.04.1996"
 */
function formatGermanText(text: string): string {
  let result = text;

  // 1. Deutsche Jahreszahlen als Wörter konvertieren (neunzehnhundertsechsundneunzig → 1996)
  result = convertGermanYearWords(result);

  // 2. Gesprochene Datumsangaben konvertieren (der zweite vierte → 02.04.)
  result = convertGermanDates(result);

  // 3. Uhrzeiten: "14 Uhr 15" → "14:15", "14 Uhr" → "14:00"
  result = result.replace(/(\d{1,2})\s*Uhr\s*(\d{1,2})?/gi, (match, hour, minute) => {
    const h = hour.padStart(2, "0");
    const m = minute ? minute.padStart(2, "0") : "00";
    return `${h}:${m}`;
  });

  // 4. Daten mit Leerzeichen normalisieren: "3. 2. 1996" → "03.02.1996"
  result = result.replace(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/g, (match, day, month, year) => {
    const d = day.padStart(2, "0");
    const m = month.padStart(2, "0");
    return `${d}.${m}.${year}`;
  });

  // 5. Daten ohne Jahr normalisieren: "3. 2." → "03.02."
  result = result.replace(/(\d{1,2})\.\s*(\d{1,2})\./g, (match, day, month) => {
    const d = day.padStart(2, "0");
    const m = month.padStart(2, "0");
    return `${d}.${m}.`;
  });

  return result;
}

export class DeepgramStreamingClient {
  private socket: WebSocket | null = null;
  private config: DeepgramConfig;
  private callbacks: DeepgramCallbacks;
  private isConnected = false;

  constructor(config: DeepgramConfig, callbacks: DeepgramCallbacks) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
  }

  /**
   * Baut WebSocket-Verbindung zu Deepgram auf
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("[Deepgram] Bereits verbunden");
      return;
    }

    const url = this.buildWebSocketUrl();
    console.log("[Deepgram] Verbinde zu:", url.replace(this.config.apiKey, "***"));

    return new Promise((resolve, reject) => {
      try {
        // WebSocket mit API Key als Subprotocol (Browser-Authentifizierung)
        this.socket = new WebSocket(url, ["token", this.config.apiKey]);
        this.socket.binaryType = "arraybuffer";

        this.socket.onopen = () => {
          console.log("[Deepgram] WebSocket verbunden");
          this.isConnected = true;
          this.callbacks.onOpen?.();
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.socket.onerror = (event) => {
          console.error("[Deepgram] WebSocket Fehler:", event);
          const error = new Error("WebSocket Verbindungsfehler");
          this.callbacks.onError(error);
          if (!this.isConnected) {
            reject(error);
          }
        };

        this.socket.onclose = (event) => {
          console.log("[Deepgram] WebSocket geschlossen:", event.code, event.reason);
          this.isConnected = false;
          this.callbacks.onClose?.();
        };
      } catch (error) {
        console.error("[Deepgram] Verbindungsfehler:", error);
        reject(error);
      }
    });
  }

  /**
   * Baut die WebSocket-URL mit allen Parametern
   */
  private buildWebSocketUrl(): string {
    const params = new URLSearchParams({
      model: this.config.model || "nova-3",
      language: this.config.language || "de",
      sample_rate: String(this.config.sampleRate || 16000),
      channels: String(this.config.channels || 1),
      encoding: this.config.encoding || "linear16",
      punctuate: String(this.config.punctuate ?? true),
      interim_results: String(this.config.interimResults ?? true),
      smart_format: String(this.config.smartFormat ?? true),
      numerals: String(this.config.numerals ?? true), // Zahlen als Ziffern
    });

    // Keyterm Prompting hinzufügen (jedes Keyterm als separater Parameter)
    const keyterms = this.config.keyterm || [];
    keyterms.forEach((term) => {
      params.append("keyterm", term);
    });

    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  }

  /**
   * Verarbeitet eingehende Nachrichten von Deepgram
   */
  private handleMessage(data: string | ArrayBuffer): void {
    if (typeof data !== "string") {
      console.warn("[Deepgram] Unerwartetes Binär-Format empfangen");
      return;
    }

    try {
      const response = JSON.parse(data);

      // Deepgram sendet verschiedene Nachrichtentypen
      if (response.type === "Results") {
        const channel = response.channel;
        const alternatives = channel?.alternatives;

        if (alternatives && alternatives.length > 0) {
          const best = alternatives[0];
          // Formatiere deutschen Text (Uhrzeiten, Daten)
          const formattedTranscript = formatGermanText(best.transcript || "");
          const result: DeepgramTranscriptResult = {
            transcript: formattedTranscript,
            confidence: best.confidence || 0,
            isFinal: response.is_final || false,
            words: best.words,
          };

          // Nur callback wenn Text vorhanden
          if (result.transcript.trim()) {
            console.log(
              `[Deepgram] ${result.isFinal ? "Final" : "Interim"}:`,
              result.transcript.substring(0, 50) + (result.transcript.length > 50 ? "..." : "")
            );
            this.callbacks.onTranscript(result);
          }
        }
      } else if (response.type === "Metadata") {
        console.log("[Deepgram] Metadata:", response.request_id);
      } else if (response.type === "SpeechStarted") {
        console.log("[Deepgram] Sprache erkannt");
      } else if (response.type === "UtteranceEnd") {
        console.log("[Deepgram] Äußerung beendet");
      }
    } catch (error) {
      console.error("[Deepgram] JSON Parse Fehler:", error);
    }
  }

  /**
   * Sendet Audio-Daten an Deepgram
   * @param audioData - LINEAR16 PCM Audio als ArrayBuffer oder Int16Array
   */
  sendAudio(audioData: ArrayBuffer | Int16Array): void {
    if (!this.socket || !this.isConnected) {
      console.warn("[Deepgram] Nicht verbunden, kann Audio nicht senden");
      return;
    }

    if (this.socket.readyState !== WebSocket.OPEN) {
      console.warn("[Deepgram] WebSocket nicht offen:", this.socket.readyState);
      return;
    }

    const buffer = audioData instanceof Int16Array ? audioData.buffer : audioData;
    this.socket.send(buffer);
  }

  /**
   * Beendet die Verbindung sauber
   */
  async disconnect(): Promise<void> {
    console.log("[Deepgram] Trenne Verbindung...");

    const socket = this.socket;
    if (!socket) {
      console.log("[Deepgram] Kein Socket vorhanden");
      this.isConnected = false;
      return;
    }

    // Sende leeres Byte-Array um Stream zu beenden (Deepgram Best Practice)
    try {
      if (this.isConnected && socket.readyState === WebSocket.OPEN) {
        socket.send(new ArrayBuffer(0));
      }
    } catch (e) {
      console.warn("[Deepgram] Fehler beim Senden des End-Signals:", e);
    }

    // Warte kurz auf letzte Nachrichten
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Socket schließen (mit Null-Check)
    try {
      if (socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }
    } catch (e) {
      console.warn("[Deepgram] Fehler beim Schließen:", e);
    }

    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Gibt Verbindungsstatus zurück
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

/**
 * Audio Stream Processor für Echtzeit-Streaming
 * Nutzt AudioWorklet für niedrige Latenz
 */
export class AudioStreamProcessor {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private onAudioData: ((data: Int16Array) => void) | null = null;
  private analyser: AnalyserNode | null = null;

  /**
   * Startet Audio-Capture und streamt Daten
   */
  async start(onAudioData: (data: Int16Array) => void): Promise<void> {
    this.onAudioData = onAudioData;

    console.log("[AudioStream] Starte Capture...");

    // Mikrofon-Zugriff
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    // AudioContext mit 16kHz
    this.audioContext = new AudioContext({ sampleRate: 16000 });

    // Source Node
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Analyser für Audio-Level (optional)
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.sourceNode.connect(this.analyser);

    // ScriptProcessor für Audio-Daten (deprecated aber zuverlässig)
    // Buffer-Größe von 4096 für Balance zwischen Latenz und Stabilität
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      const int16Data = this.float32ToInt16(inputData);
      this.onAudioData?.(int16Data);
    };

    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);

    console.log("[AudioStream] Capture gestartet");
  }

  /**
   * Gibt aktuellen Audio-Level zurück (0-100)
   */
  getAudioLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((acc, val) => acc + val, 0);
    const average = sum / dataArray.length;

    return Math.min(100, Math.round((average / 255) * 100 * 1.5));
  }

  /**
   * Stoppt Audio-Capture
   */
  stop(): void {
    console.log("[AudioStream] Stoppe Capture...");

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.onAudioData = null;
    console.log("[AudioStream] Capture gestoppt");
  }

  /**
   * Konvertiert Float32 zu Int16 (LINEAR16)
   */
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }

    return int16Array;
  }
}

/**
 * Hilfsfunktion: Erstellt komplettes Streaming-Setup
 */
export async function createDeepgramStream(
  apiKey: string,
  callbacks: DeepgramCallbacks,
  language: string = "de"
): Promise<{ client: DeepgramStreamingClient; processor: AudioStreamProcessor }> {
  const client = new DeepgramStreamingClient(
    { apiKey, language },
    callbacks
  );

  const processor = new AudioStreamProcessor();

  // Verbindung aufbauen
  await client.connect();

  // Audio-Streaming starten
  await processor.start((audioData) => {
    client.sendAudio(audioData);
  });

  return { client, processor };
}

/**
 * Holt Deepgram API Key aus Environment
 */
export function getDeepgramApiKey(): string | null {
  // Client-seitig: Aus NEXT_PUBLIC_ Variable
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || null;
  }
  // Server-seitig: Aus normaler Variable
  return process.env.DEEPGRAM_API_KEY || null;
}
