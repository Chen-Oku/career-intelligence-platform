import { z } from "zod";

// Fields the AI can generate/evaluate — the user's own voice guide isn't one of these,
// it's config they author directly, not content generated or coached on.
export const generatableProfileFieldSchema = z.enum(["aboutMe", "elevatorPitch", "strengths"]);

// All fields fetchable/savable via GET /api/profile and POST /api/profile/save.
// geminiApiKey is the user's own Gemini key (BYOK) — config the user authors,
// like voiceGuide, not AI-generated content.
export const profileFieldSchema = z.enum(["aboutMe", "elevatorPitch", "strengths", "voiceGuide", "geminiApiKey"]);

const MAX_LENGTH: Record<z.infer<typeof profileFieldSchema>, number> = {
  aboutMe: 2000,
  elevatorPitch: 1500,
  strengths: 2000,
  voiceGuide: 1000,
  geminiApiKey: 200,
};

export const guidedAnswerSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(500),
});

export const generateProfileTextSchema = z.object({
  field: generatableProfileFieldSchema,
  language: z.enum(["en", "es"]).default("en"),
  guidedAnswers: z.array(guidedAnswerSchema).max(6).optional(),
});

export type GenerateProfileTextInput = z.infer<typeof generateProfileTextSchema>;

export const saveProfileTextSchema = z.object({
  field: profileFieldSchema,
  text: z.string().max(2000),
}).refine((data) => data.text.length <= MAX_LENGTH[data.field], {
  message: "Text is too long for this field.",
  path: ["text"],
});

export type SaveProfileTextInput = z.infer<typeof saveProfileTextSchema>;

export const evaluateProfileTextSchema = z.object({
  field: generatableProfileFieldSchema,
  draftText: z.string().min(1, "Write a draft before requesting feedback.").max(2000),
  language: z.enum(["en", "es"]).default("en"),
});

export type EvaluateProfileTextInput = z.infer<typeof evaluateProfileTextSchema>;
