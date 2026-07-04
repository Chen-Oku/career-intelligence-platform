import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { ProfilePitchService } from "@/infrastructure/ai/gemini/ProfilePitchService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";

export type ProfileTextField = "aboutMe" | "elevatorPitch" | "strengths";

export interface GenerateProfileTextCommand {
  userId: string;
  field: ProfileTextField;
  language: string;
  guidedAnswers?: { question: string; answer: string }[];
  /** Optional word-count target (e.g. to fit a job application's length cap). */
  targetWords?: number;
}

export interface GenerateProfileTextResultValue {
  field: ProfileTextField;
  text: string;
}

export type GenerateProfileTextResult = AsyncResult<GenerateProfileTextResultValue>;

/**
 * GenerateProfileTextUseCase
 *
 * Generates a fresh draft only — does not persist. The user reviews
 * the draft and explicitly saves it (see UpdateProfileText), matching
 * "Generate / Edit+Save / Evaluate" as three distinct actions.
 */
export class GenerateProfileTextUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: ProfilePitchService,
  ) {}

  async execute(command: GenerateProfileTextCommand): GenerateProfileTextResult {
    const [skills, experiences, stories, projects, user] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      prisma.user.findUnique({ where: { id: command.userId }, select: { voiceGuide: true } }),
    ]);
    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);
    const voiceGuide = user?.voiceGuide;

    try {
      const text = command.field === "aboutMe"
        ? await this.aiService.generateAboutMe(profile, command.language, command.guidedAnswers, voiceGuide, command.targetWords)
        : command.field === "elevatorPitch"
        ? await this.aiService.generateElevatorPitch(profile, command.language, command.guidedAnswers, voiceGuide, command.targetWords)
        : await this.aiService.generateStrengths(profile, command.language, command.guidedAnswers, voiceGuide, command.targetWords);
      return Result.ok({ field: command.field, text });
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Generation failed."));
    }
  }
}
