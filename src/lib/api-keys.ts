/**
 * API-Key Management
 * Wird in Phase 5 implementiert
 *
 * Konzept:
 * - Demo-Keys sind verschlüsselt im Rust-Backend
 * - Erster Start: Blob → macOS Keychain → Blob löschen
 * - Nach 50 Anfragen: Self-Destruct (Keys aus Keychain löschen)
 */

export const DEMO_REQUEST_LIMIT = 50;

export interface ApiKeyStatus {
  hasValidKeys: boolean;
  remainingRequests: number;
  isDemo: boolean;
}

export async function getApiKeyStatus(): Promise<ApiKeyStatus> {
  throw new Error("Nicht implementiert - Phase 5");
}

export async function incrementRequestCount(): Promise<number> {
  throw new Error("Nicht implementiert - Phase 5");
}
