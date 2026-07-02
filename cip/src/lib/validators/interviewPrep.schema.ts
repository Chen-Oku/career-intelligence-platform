import { z } from "zod";

export const interviewPrepTypeSchema = z.enum([
  "tellMeAboutYourself",
  "weakness",
  "salaryExpectations",
  "leadershipStory",
  "conflictStory",
  "teamworkStory",
]);

export type InterviewPrepType = z.infer<typeof interviewPrepTypeSchema>;

export const guidedAnswerSchema = z.object({
  question: z.string().min(1).max(200),
  answer: z.string().min(1).max(500),
});

// weakness and salaryExpectations can't be generated without the candidate's
// own input (a real weakness, a real target range) — grounding rule forbids
// inventing either — so those two types require at least one guided answer.
const REQUIRES_GUIDANCE: ReadonlySet<InterviewPrepType> = new Set(["weakness", "salaryExpectations"]);

export const generateInterviewPrepSchema = z.object({
  type: interviewPrepTypeSchema,
  language: z.enum(["en", "es"]).default("en"),
  guidedAnswers: z.array(guidedAnswerSchema).max(6).optional(),
}).refine((data) => !REQUIRES_GUIDANCE.has(data.type) || (data.guidedAnswers && data.guidedAnswers.length > 0), {
  message: "This answer needs at least one guided answer before it can be generated.",
  path: ["guidedAnswers"],
});

export type GenerateInterviewPrepInput = z.infer<typeof generateInterviewPrepSchema>;

export const saveInterviewPrepSchema = z.object({
  type: interviewPrepTypeSchema,
  text: z.string().min(1).max(2000),
});

export type SaveInterviewPrepInput = z.infer<typeof saveInterviewPrepSchema>;

export const evaluateInterviewPrepSchema = z.object({
  type: interviewPrepTypeSchema,
  draftText: z.string().min(1, "Write a draft before requesting feedback.").max(2000),
  language: z.enum(["en", "es"]).default("en"),
});

export type EvaluateInterviewPrepInput = z.infer<typeof evaluateInterviewPrepSchema>;
