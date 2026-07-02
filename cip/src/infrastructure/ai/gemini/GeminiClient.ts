/**
 * AI completion client — single swap point for all AI generation calls.
 *
 * All AI services (ResumeGenerator, JobAnalyzer, InterviewCoach, etc.)
 * depend on geminiComplete() — never on an AI SDK directly. Changing the
 * underlying provider only requires touching this file.
 *
 * Provider chain (first available wins):
 * 1. AI Core (AI_CORE_BASE_URL + AI_CORE_API_KEY) — the local-first
 *    platform. If it's configured but unreachable/failing AND a Gemini key
 *    exists, we fall back instead of erroring, so a deployed instance keeps
 *    working when the tunnel to a local AI Core is down.
 * 2. The user's own Gemini API key, saved in their profile (read from the
 *    request-scoped context set by withUserAiContext in the AI routes).
 * 3. The deployment's GEMINI_API_KEY env var (e.g. a free-tier key), shared
 *    by every user of the instance.
 */

import { getRequestGeminiKey } from "../requestAiContext";

export interface CompletionParams {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Qwen3 (served via AI Core) emits a <think>...</think> reasoning block before
 * the actual answer when thinking mode is on. Ideally AI Core disables this
 * or strips it server-side for non-chat callers, but every consumer here
 * expects a raw JSON string, so strip defensively regardless of what AI Core
 * does — a stray reasoning block otherwise breaks "start immediately with {".
 */
function stripThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export async function geminiComplete(params: CompletionParams): Promise<string> {
  const aiCoreUrl = process.env.AI_CORE_BASE_URL;
  const aiCoreKey = process.env.AI_CORE_API_KEY;
  const geminiKey = getRequestGeminiKey() ?? process.env.GEMINI_API_KEY?.trim();

  if (aiCoreUrl && aiCoreKey) {
    try {
      return await completeViaAiCore(aiCoreUrl, aiCoreKey, params);
    } catch (error) {
      if (!geminiKey) throw error;
      console.warn(
        "[GeminiClient] AI Core unavailable, falling back to Gemini API:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  if (!geminiKey) {
    throw new Error(
      "No AI provider available. Configure AI Core (AI_CORE_BASE_URL/AI_CORE_API_KEY), " +
        "set GEMINI_API_KEY, or save your own Gemini API key in Profile → AI settings.",
    );
  }

  return completeViaGemini(geminiKey, params);
}

async function completeViaAiCore(
  baseUrl: string,
  apiKey: string,
  params: CompletionParams,
): Promise<string> {
  const response = await fetch(`${baseUrl}/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      system: params.system,
      prompt: params.prompt,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.6,
      top_p: params.topP ?? 0.9,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`AI Core /completions failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { text: string };
  return stripThinkTags(data.text);
}

async function completeViaGemini(apiKey: string, params: CompletionParams): Promise<string> {
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.system }] },
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
        generationConfig: {
          maxOutputTokens: params.maxTokens ?? 4096,
          temperature: params.temperature ?? 0.6,
          topP: params.topP ?? 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    // Don't leak whether the key was user-provided or the server's.
    throw new Error(`Gemini API failed (${response.status}): ${detail.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");

  if (!text.trim()) {
    throw new Error("Gemini API returned an empty response. Please try again.");
  }
  return stripThinkTags(text);
}
