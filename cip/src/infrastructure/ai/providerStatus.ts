/**
 * Live status of which AI backend is currently serving completions.
 *
 * Mirrors the exact provider chain geminiComplete() uses (GeminiClient.ts) —
 * AI Core first, then the resolved Gemini key, then none — so what this
 * reports matches what a real generation call would actually use.
 */
import { getRequestGeminiKey } from "./requestAiContext";
import type { AiProviderStatus } from "@/lib/types/aiProvider";

const STATUS_TIMEOUT_MS = 3000;

export async function getAiProviderStatus(): Promise<AiProviderStatus> {
  const aiCoreUrl = process.env.AI_CORE_BASE_URL;
  const aiCoreKey = process.env.AI_CORE_API_KEY;

  if (aiCoreUrl && aiCoreKey) {
    const status = await fetchAiCoreStatus(aiCoreUrl, aiCoreKey);
    if (status) return status;
  }

  const geminiKey = getRequestGeminiKey() ?? process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    return { source: "gemini", provider: "gemini", model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash" };
  }

  return { source: "none", provider: null, model: null };
}

/**
 * AI Core's /providers/status returns { provider, model } (both strings,
 * e.g. { provider: "ollama", model: "qwen3:14b" }). Any failure
 * (unreachable, bad JSON, missing fields) is treated as "no status",
 * falling through to the Gemini check exactly like completeViaAiCore's
 * failure does for real completions.
 */
async function fetchAiCoreStatus(baseUrl: string, apiKey: string): Promise<AiProviderStatus | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), STATUS_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/providers/status`, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { provider?: string; model?: string };
    if (!data.provider) return null;

    return { source: "ai-core", provider: data.provider, model: data.model ?? null };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
