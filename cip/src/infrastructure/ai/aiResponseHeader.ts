import { NextResponse } from "next/server";
import { AI_PROVIDER_HEADER, type AiProviderSource } from "@/lib/types/aiProvider";

/**
 * Attaches the AI_PROVIDER_HEADER to a response so the client learns which
 * provider actually served the request (see withUserAiContextTracked). No-op
 * when usedProvider is null (no AI call was made), leaving the response as-is.
 */
export function withProviderHeader(
  res: NextResponse,
  usedProvider: AiProviderSource | null,
): NextResponse {
  if (usedProvider) res.headers.set(AI_PROVIDER_HEADER, usedProvider);
  return res;
}
