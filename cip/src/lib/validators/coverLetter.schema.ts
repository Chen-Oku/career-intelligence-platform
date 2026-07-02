import { z } from "zod";

export const generateCoverLetterSchema = z.object({
  jobDescriptionId: z.string().min(1, "Select a job analysis to generate a cover letter for."),
  language: z.enum(["en", "es"]).default("en"),
  extraNotes: z.string().max(1000).optional(),
});

export type GenerateCoverLetterInput = z.infer<typeof generateCoverLetterSchema>;
