/**
 * Anthropic Claude API Integration (Brain)
 * Wird in Phase 5 implementiert
 */

export type EnrichmentMode =
  | "format"
  | "summarize"
  | "email"
  | "meeting"
  | "todo"
  | "translate";

export interface EnrichmentConfig {
  model: string;
  maxTokens: number;
  mode: EnrichmentMode;
}

export const defaultEnrichmentConfig: EnrichmentConfig = {
  model: "claude-haiku-4-5",
  maxTokens: 200,
  mode: "format",
};

export async function enrichText(
  _text: string,
  _config?: Partial<EnrichmentConfig>
): Promise<string> {
  throw new Error("Nicht implementiert - Phase 5");
}
