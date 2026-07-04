import { AI_PROVIDER_HEADER } from "@/lib/types/aiProvider";
import { providerSourceLabel } from "@/lib/aiProviderDisplay";

export interface AiJsonResult<T> {
  data: T;
  /**
   * Display label of the provider that ACTUALLY served the request
   * (e.g. "Doku LLM", "Gemini"), read from the AI_PROVIDER_HEADER — null when
   * the route reported no provider. Lets the UI show which engine was used,
   * including a silent AI Core → Gemini fallback.
   */
  aiProvider: string | null;
}

/** POST JSON to an AI generation route, returning the data plus which provider served it. */
export async function postAiJson<T>(url: string, body: unknown): Promise<AiJsonResult<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.error ?? `Request failed: ${res.status}`);
  }
  const source = res.headers.get(AI_PROVIDER_HEADER);
  const data = (await res.json()).data as T;
  return { data, aiProvider: source ? providerSourceLabel(source) : null };
}
