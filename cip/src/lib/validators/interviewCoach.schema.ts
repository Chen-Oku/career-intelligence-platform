import { z } from "zod";

export const evaluateAnswerSchema = z.object({
  question: z.string().min(1, "Question is required.").max(500),
  userAnswer: z.string().min(1, "Write an answer before requesting feedback.").max(5000),
});

export type EvaluateAnswerInput = z.infer<typeof evaluateAnswerSchema>;
