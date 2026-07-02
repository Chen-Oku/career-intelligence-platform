import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { ProfilePitchService } from "@/infrastructure/ai/gemini/ProfilePitchService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";
import type { ProfileTextField } from "./GenerateProfileText";

export interface EvaluateProfileTextCommand {
  userId: string;
  field: ProfileTextField;
  draftText: string;
  language: string;
}

export type EvaluateProfileTextResult = AsyncResult<AnswerFeedback>;

/**
 * EvaluateProfileTextUseCase
 *
 * No persistence — on-demand coaching feedback. Uses ProfilePitchService's
 * bio-specific rubric (voice, grounding, clarity), not the interview coach's
 * STAR-structure rubric — a bio isn't an interview answer.
 */
export class EvaluateProfileTextUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: ProfilePitchService,
  ) {}

  async execute(command: EvaluateProfileTextCommand): EvaluateProfileTextResult {
    const [skills, experiences, stories, projects, user] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      prisma.user.findUnique({ where: { id: command.userId }, select: { voiceGuide: true } }),
    ]);
    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);

    try {
      const feedback = await this.aiService.evaluateDraft(command.field, command.draftText, profile, command.language, user?.voiceGuide);
      return Result.ok(feedback);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Evaluation failed."));
    }
  }
}
