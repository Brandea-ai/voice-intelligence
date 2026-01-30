/**
 * TypeScript-Deklarationen für Tauri
 */

declare global {
  interface Window {
    __TAURI__?: {
      [key: string]: unknown;
    };
  }
}

export {};
