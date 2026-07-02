import { z } from "zod";

export const analyzeJobSchema = z.object({
  /** Company name — optional, Gemini will extract from the description */
  company:     z.string().max(200).default(""),
  /** Job title label — optional, Gemini will extract from the description */
  title:       z.string().max(200).default(""),
  /** The full job posting text */
  rawText:     z.string().min(50, "Paste the full job description (minimum 50 characters).").max(10_000),
  language:    z.enum(["en", "es"]).default("en"),
});

export type AnalyzeJobInput = z.infer<typeof analyzeJobSchema>;
