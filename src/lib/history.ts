/**
 * Lokaler Verlauf (tauri-plugin-store)
 * Wird in Phase 7 implementiert
 */

export interface HistoryEntry {
  id: string;
  timestamp: string;
  input: string;
  output: string;
  mode: string;
}

export interface HistoryStore {
  entries: HistoryEntry[];
  maxEntries: number;
}

export const MAX_HISTORY_ENTRIES = 50;

export async function saveToHistory(
  _entry: Omit<HistoryEntry, "id" | "timestamp">
): Promise<void> {
  throw new Error("Nicht implementiert - Phase 7");
}

export async function getHistory(): Promise<HistoryEntry[]> {
  throw new Error("Nicht implementiert - Phase 7");
}

export async function clearHistory(): Promise<void> {
  throw new Error("Nicht implementiert - Phase 7");
}

export async function copyFromHistory(_id: string): Promise<void> {
  throw new Error("Nicht implementiert - Phase 7");
}
