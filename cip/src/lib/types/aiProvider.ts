export type AiProviderSource = "ai-core" | "gemini" | "none";

export interface AiProviderStatus {
  source: AiProviderSource;
  /** Raw provider id as reported by the backend (e.g. "ollama", "gemini"); null when source is "none". */
  provider: string | null;
  model: string | null;
}

/**
 * Response header AI generation routes set to report which provider ACTUALLY
 * served the request — as opposed to /provider-status, which only predicts.
 * This is how the client can tell a silent AI Core → Gemini fallback happened.
 * Value is an AiProviderSource ("ai-core" | "gemini").
 */
export const AI_PROVIDER_HEADER = "x-ai-provider";
