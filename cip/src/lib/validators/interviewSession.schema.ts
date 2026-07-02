import { z } from "zod";

const answerFeedbackSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  rewrittenSuggestion: z.string().nullable().optional(),
});

const interviewSessionQuestionSchema = z.object({
  question: z.string().min(1),
  type: z.enum(["BEHAVIORAL", "TECHNICAL", "SITUATIONAL"]),
  storyHint: z.string().nullable().optional(),
  suggestedAnswer: z.string().nullable().optional(),
  finalAnswer: z.string(),
  answeredVia: z.enum(["ai-suggested", "own-draft", "skipped"]),
  feedback: answerFeedbackSchema.nullable(),
});

export const createInterviewSessionSchema = z.object({
  jobDescriptionId: z.string().optional(),
  role: z.string().min(1).max(200),
  questions: z.array(interviewSessionQuestionSchema).min(1),
  language: z.enum(["en", "es"]).default("en"),
  sessionType: z.enum(["BEHAVIORAL", "TECHNICAL", "MIXED", "SALARY"]),
});

export type CreateInterviewSessionInput = z.infer<typeof createInterviewSessionSchema>;
