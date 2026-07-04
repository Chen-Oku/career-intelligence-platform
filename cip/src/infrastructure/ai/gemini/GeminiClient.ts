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

import { getRequestGeminiKey, setUsedAiProvider } from "../requestAiContext";

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
    // Fast reachability probe first: distinguishes "AI Core is down/hanging"
    // (fail over to Gemini in ~1s, don't burn the request budget waiting on a
    // completion timeout) from "AI Core is up, just slow" (be patient and let
    // the long completion timeout ride — we prefer the local LLM's output). If
    // there's no Gemini fallback anyway, skip the probe and just try it so a
    // real error surfaces.
    const shouldTry = !geminiKey || (await aiCoreReachable(aiCoreUrl, aiCoreKey));
    if (shouldTry) {
      try {
        const text = await completeViaAiCore(aiCoreUrl, aiCoreKey, params);
        setUsedAiProvider("ai-core");
        return text;
      } catch (error) {
        if (!geminiKey) throw error;
        console.warn(
          `[GeminiClient] AI Core (${aiCoreUrl}) failed after a successful reachability probe, falling back to Gemini API:`,
          error instanceof Error ? error.message : error,
        );
      }
    } else {
      console.warn(
        `[GeminiClient] AI Core (${aiCoreUrl}) unreachable (probe failed), using Gemini API.`,
      );
    }
  }

  if (!geminiKey) {
    throw new Error(
      "No AI provider available. Configure AI Core (AI_CORE_BASE_URL/AI_CORE_API_KEY), " +
        "set GEMINI_API_KEY, or save your own Gemini API key in Profile → AI settings.",
    );
  }

  const text = await completeViaGemini(geminiKey, params);
  setUsedAiProvider("gemini");
  return text;
}

// Completion timeout, only reached once the reachability probe has confirmed AI
// Core is up (see geminiComplete). Because "is it down?" is already answered by
// the probe, this can be patient: with thinking disabled (aiCoreSystem) a full
// resume is ~18s, but under load it can run longer, and we'd rather wait for the
// local LLM than abandon it for Gemini. 50s stays just under Vercel's 60s
// maxDuration. Raise it (self-host, no 60s cap) or lower it (leave more room for
// a Gemini fallback) via AI_CORE_TIMEOUT_MS.
const AI_CORE_TIMEOUT_MS = Number(process.env.AI_CORE_TIMEOUT_MS) || 50000;

// Reachability-probe timeout. /providers/status answers in well under a second
// when AI Core is up, so a few seconds is plenty; if the tunnel is down or
// hanging the probe fails here instead of the completion stalling for 50s.
const AI_CORE_PROBE_MS = Number(process.env.AI_CORE_PROBE_MS) || 4000;

/**
 * Cheap "is AI Core actually up?" check before committing to a long completion.
 * Hits /providers/status (fast, no generation). Any failure — unreachable,
 * timeout, non-2xx — counts as down so we fail over to Gemini quickly rather
 * than waiting out AI_CORE_TIMEOUT_MS on a completion that will never arrive.
 */
async function aiCoreReachable(baseUrl: string, apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/providers/status`, {
      headers: { "X-API-Key": apiKey, "ngrok-skip-browser-warning": "true" },
      signal: AbortSignal.timeout(AI_CORE_PROBE_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Qwen3 (the model AI Core serves) runs in "thinking" mode by default, emitting
 * a long <think>…</think> reasoning block before the answer. For our structured,
 * grounded generation tasks (rewrite this career data into resume JSON) that
 * reasoning adds little but dominates latency: a full resume took ~86s WITH
 * thinking vs ~18s with it off — the difference between blowing past Vercel's
 * 60s budget (→ fall back to Gemini) and comfortably serving the local LLM.
 *
 * Qwen3 honors a `/no_think` soft switch in the prompt to disable it, so append
 * it here (AI Core path only — Gemini never sees it). Set AI_CORE_THINKING=true
 * to keep thinking on (e.g. if AI Core is later pointed at a model that needs it).
 */
function aiCoreSystem(system: string): string {
  if (process.env.AI_CORE_THINKING === "true") return system;
  return `${system}\n\n/no_think`;
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
      // Free ngrok static domains serve an HTML "you're about to visit..."
      // interstitial to any request lacking this header, instead of
      // proxying to AI Core — this bypasses it for server-to-server calls.
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({
      system: aiCoreSystem(params.system),
      prompt: params.prompt,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.6,
      top_p: params.topP ?? 0.9,
    }),
    signal: AbortSignal.timeout(AI_CORE_TIMEOUT_MS),
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
