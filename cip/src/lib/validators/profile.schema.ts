import { z } from "zod";

// Fields the AI can generate/evaluate — the user's own voice guide isn't one of these,
// it's config they author directly, not content generated or coached on.
export const generatableProfileFieldSchema = z.enum(["aboutMe", "elevatorPitch", "strengths"]);

// All fields fetchable/savable via GET /api/profile and POST /api/profile/save.
// geminiApiKey is the user's own Gemini key (BYOK) — config the user authors,
// like voiceGuide, not AI-generated content.
export const profileFieldSchema = z.enum(["aboutMe", "elevatorPitch", "strengths", "voiceGuide", "geminiApiKey"]);

// Generous per-field sanity ceiling. The DB columns are unbounded Postgres text,
// so these exist only to reject absurd payloads — NOT to block a normal (even
// long) generation from saving. geminiApiKey stays tight because it's a key, not
// prose. Previously these were ~2000 and a slightly-over generation (e.g. a 2200-
// char Strengths) couldn't be saved at all; the user asked to save regardless.
const MAX_LENGTH: Record<z.infer<typeof profileFieldSchema>, number> = {
  aboutMe: 20000,
  elevatorPitch: 20000,
  strengths: 20000,
  voiceGuide: 20000,
  geminiApiKey: 200,
};

// Word-count target the user can request for a generation — e.g. to fit a job
// application's length cap. Optional; omitted means "use the field's default length".
export const targetWordsSchema = z.number().int().min(20).max(1500);

export const guidedAnswerSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(500),
});

export const generateProfileTextSchema = z.object({
  field: generatableProfileFieldSchema,
  language: z.enum(["en", "es"]).default("en"),
  guidedAnswers: z.array(guidedAnswerSchema).max(6).optional(),
  targetWords: targetWordsSchema.optional(),
});

export type GenerateProfileTextInput = z.infer<typeof generateProfileTextSchema>;

export const saveProfileTextSchema = z.object({
  field: profileFieldSchema,
  text: z.string().max(20000),
}).refine((data) => data.text.length <= MAX_LENGTH[data.field], {
  message: "Text is too long for this field.",
  path: ["text"],
});

export type SaveProfileTextInput = z.infer<typeof saveProfileTextSchema>;

export const evaluateProfileTextSchema = z.object({
  field: generatableProfileFieldSchema,
  draftText: z.string().min(1, "Write a draft before requesting feedback.").max(20000),
  language: z.enum(["en", "es"]).default("en"),
});

export type EvaluateProfileTextInput = z.infer<typeof evaluateProfileTextSchema>;
