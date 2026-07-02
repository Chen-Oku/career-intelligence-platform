import { InterviewPrepAnswerType } from "@prisma/client";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";

export interface InterviewPrepAnswerDTO {
  type: InterviewPrepType;
  content: string;
  language: string;
  updatedAt: string;
}

/** Maps our camelCase type to the Prisma enum stored in the DB. */
export const PRISMA_TYPE_MAP: Record<InterviewPrepType, InterviewPrepAnswerType> = {
  tellMeAboutYourself: "TELL_ME_ABOUT_YOURSELF",
  weakness: "WEAKNESS",
  salaryExpectations: "SALARY_EXPECTATIONS",
  leadershipStory: "LEADERSHIP_STORY",
  conflictStory: "CONFLICT_STORY",
  teamworkStory: "TEAMWORK_STORY",
};

export const FROM_PRISMA_TYPE_MAP: Record<string, InterviewPrepType> = Object.fromEntries(
  Object.entries(PRISMA_TYPE_MAP).map(([k, v]) => [v, k as InterviewPrepType]),
);
