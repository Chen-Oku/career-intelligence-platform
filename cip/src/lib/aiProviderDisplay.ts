/**
 * Maps raw AI backend provider ids to the platform's own display names.
 * This mapping is presentation-only — it doesn't live in AI Core.
 */
const PROVIDER_LABELS: Record<string, string> = {
  ollama: "Doku LLM",
  gemini: "Gemini",
};

export function providerDisplayName(provider: string | null): string {
  if (!provider) return "—";
  return PROVIDER_LABELS[provider.toLowerCase()] ?? provider;
}

/**
 * Display name for an AiProviderSource — used when reporting which provider
 * actually served a generation (the AI_PROVIDER_HEADER value). "ai-core" serves
 * the local Doku LLM, so it's branded the same as the ollama provider above.
 */
export function providerSourceLabel(source: string | null): string {
  if (source === "ai-core") return PROVIDER_LABELS.ollama;
  if (source === "gemini") return PROVIDER_LABELS.gemini;
  return "—";
}
