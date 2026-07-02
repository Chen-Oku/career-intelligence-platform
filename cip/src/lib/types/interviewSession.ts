import type { InterviewSession } from "@/domain/intelligence/entities/InterviewSession";
import type { AnswerFeedback } from "./interviewCoach";

/**
 * InterviewSessionQuestion — the per-question shape stored inside
 * InterviewSession.questions (Json). Captures what was shown to the
 * candidate AND what they actually did with it, so a saved session
 * is a faithful recap of the walkthrough.
 */
export interface InterviewSessionQuestion {
  question: string;
  type: "BEHAVIORAL" | "TECHNICAL" | "SITUATIONAL";
  storyHint?: string | null;
  suggestedAnswer?: string | null;
  finalAnswer: string;
  answeredVia: "ai-suggested" | "own-draft" | "skipped";
  feedback: AnswerFeedback | null;
}

export interface InterviewSessionDTO {
  id: string;
  jobDescriptionId?: string;
  role: string;
  questions: InterviewSessionQuestion[];
  language: string;
  sessionType: "BEHAVIORAL" | "TECHNICAL" | "MIXED" | "SALARY";
  createdAt: string;
  updatedAt: string;
}

export function toInterviewSessionDTO(session: InterviewSession): InterviewSessionDTO {
  return {
    id: session.id,
    jobDescriptionId: session.jobDescriptionId,
    role: session.role,
    questions: session.questions as InterviewSessionQuestion[],
    language: session.language,
    sessionType: session.sessionType,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

/** Derives a session-level type from the mix of question types actually asked. */
export function deriveSessionType(questions: InterviewSessionQuestion[]): "BEHAVIORAL" | "TECHNICAL" | "MIXED" {
  const types = new Set(questions.map((q) => q.type));
  if (types.size === 1) {
    const only = [...types][0];
    if (only === "BEHAVIORAL" || only === "TECHNICAL") return only;
  }
  return "MIXED";
}
