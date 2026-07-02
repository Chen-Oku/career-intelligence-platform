import { z } from "zod";

/**
 * Assistant chat request schema.
 *
 * The server is stateless: the client owns the conversation and sends the
 * recent history with each message. History is capped so a long chat can't
 * blow up the prompt (the model only needs recent context anyway).
 */
export const assistantChatSchema = z.object({
  message: z.string().min(1, "Message is required.").max(8000),
  language: z.string().min(2).max(10).default("en"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(12)
    .default([]),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
