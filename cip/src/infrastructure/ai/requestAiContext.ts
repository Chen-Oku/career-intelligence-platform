import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/infrastructure/database/client";

/**
 * Request-scoped AI context.
 *
 * geminiComplete() is a plain function called deep inside services that know
 * nothing about the current user. To let a user's own Gemini API key (saved
 * in their profile) take effect without threading it through every service
 * signature, AI routes wrap their use-case call in withUserAiContext() and
 * the client reads the key back via AsyncLocalStorage.
 */
const storage = new AsyncLocalStorage<{ geminiApiKey?: string }>();

export function getRequestGeminiKey(): string | undefined {
  const key = storage.getStore()?.geminiApiKey?.trim();
  return key || undefined;
}

export async function withUserAiContext<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { geminiApiKey: true },
  });
  return storage.run({ geminiApiKey: user?.geminiApiKey ?? undefined }, fn);
}
