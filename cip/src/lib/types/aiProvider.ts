export type AiProviderSource = "ai-core" | "gemini" | "none";

export interface AiProviderStatus {
  source: AiProviderSource;
  /** Raw provider id as reported by the backend (e.g. "ollama", "gemini"); null when source is "none". */
  provider: string | null;
  model: string | null;
}
