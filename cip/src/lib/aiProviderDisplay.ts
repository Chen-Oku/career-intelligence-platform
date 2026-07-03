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
