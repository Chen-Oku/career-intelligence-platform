import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/infrastructure/database/client";
import type { AiProviderSource } from "@/lib/types/aiProvider";

/**
 * Request-scoped AI context.
 *
 * geminiComplete() is a plain function called deep inside services that know
 * nothing about the current user. To let a user's own Gemini API key (saved
 * in their profile) take effect without threading it through every service
 * signature, AI routes wrap their use-case call in withUserAiContext() and
 * the client reads the key back via AsyncLocalStorage.
 *
 * The store is also the channel back OUT: geminiComplete records which provider
 * actually served the request (usedProvider), so a route can report the real
 * provider — including a silent AI Core → Gemini fallback — to the client.
 */
interface AiContextStore {
  geminiApiKey?: string;
  usedProvider?: AiProviderSource;
}

const storage = new AsyncLocalStorage<AiContextStore>();

export function getRequestGeminiKey(): string | undefined {
  const key = storage.getStore()?.geminiApiKey?.trim();
  return key || undefined;
}

/** Called by geminiComplete() to record which provider actually served the call. */
export function setUsedAiProvider(provider: AiProviderSource): void {
  const store = storage.getStore();
  if (store) store.usedProvider = provider;
}

export async function withUserAiContext<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  return storage.run({ geminiApiKey: user?.geminiApiKey ?? undefined }, fn);
}

/**
 * Like withUserAiContext, but also reports which provider actually served the
 * request (null if no AI call was made). Use in generation routes that want to
 * tell the client the real provider via the AI_PROVIDER_HEADER response header.
 */
export async function withUserAiContextTracked<T>(
  userId: string,
  fn: () => Promise<T>,
): Promise<{ result: T; usedProvider: AiProviderSource | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  const store: AiContextStore = { geminiApiKey: user?.geminiApiKey ?? undefined };
  const result = await storage.run(store, fn);
  return { result, usedProvider: store.usedProvider ?? null };
}
