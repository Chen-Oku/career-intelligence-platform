/**
 * AI Core client — single swap point for all AI generation calls.
 *
 * All AI services (ResumeGenerator, JobAnalyzer, InterviewCoach, etc.)
 * depend on geminiComplete() — never on an AI SDK directly. Changing the
 * underlying provider only requires touching this file.
 */

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
  const baseUrl = process.env.AI_CORE_BASE_URL;
  const apiKey = process.env.AI_CORE_API_KEY;

  if (!baseUrl) throw new Error("AI_CORE_BASE_URL is not set.");
  if (!apiKey) throw new Error("AI_CORE_API_KEY is not set.");

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
