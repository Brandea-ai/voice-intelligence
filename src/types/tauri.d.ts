/**
 * TypeScript-Deklarationen für Tauri v2
 */

declare global {
  interface Window {
    // Tauri v1 (legacy)
    __TAURI__?: {
      [key: string]: unknown;
    };
    // Tauri v2
    __TAURI_INTERNALS__?: {
      [key: string]: unknown;
    };
    isTauri?: boolean;
  }
}

export {};
