import { z } from "zod";

/**
 * ResumeTypePreset Zod schemas.
 * Same dual-use pattern as certification.schema.ts:
 * API route validation + react-hook-form client validation.
 */

const resumeTypePresetShape = z.object({
  name:               z.string().min(1, "Preset name is required.").max(100),
  focus:              z.string().min(1, "Focus is required.").max(2000),
  vocabulary:         z.string().max(500).optional(),
  prioritizeKeywords: z.array(z.string().min(1).max(100)).max(20).default([]),
  defaultTitle:       z.string().max(200).optional(),
});

export const createResumeTypePresetSchema = resumeTypePresetShape;

export const updateResumeTypePresetSchema = resumeTypePresetShape.partial().extend({
  id: z.string().min(1, "Invalid preset ID."),
});

export type CreateResumeTypePresetInput = z.infer<typeof createResumeTypePresetSchema>;
export type UpdateResumeTypePresetInput = z.infer<typeof updateResumeTypePresetSchema>;

export const suggestResumeTypePresetsSchema = z.object({
  language: z.enum(["en", "es"]).default("en"),
});

export type SuggestResumeTypePresetsInput = z.infer<typeof suggestResumeTypePresetsSchema>;
