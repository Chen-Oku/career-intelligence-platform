import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { ICoverLetterRepository } from "@/domain/document/repositories/ICoverLetterRepository";
import { CoverLetter } from "@/domain/document/entities/CoverLetter";
import { CoverLetterService } from "@/infrastructure/ai/gemini/CoverLetterService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import { CoverLetterDTO, toCoverLetterDTO } from "@/lib/types/coverLetter";
import type { JobAnalysisData } from "@/lib/types/job";

export interface GenerateCoverLetterCommand {
  userId: string;
  jobDescriptionId: string;
  language: string;
  extraNotes?: string;
}

export type GenerateCoverLetterResult = AsyncResult<CoverLetterDTO>;

/**
 * GenerateCoverLetterUseCase
 *
 * Always grounded in a job posting the user already ran through Job
 * Analyzer — reuses its extracted requirements/hiringInsights/match data
 * instead of asking the user to re-paste the posting, and keeps "why this
 * company" grounded in what the posting actually says rather than invented
 * outside research.
 */
export class GenerateCoverLetterUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly coverLetterRepo: ICoverLetterRepository,
    private readonly aiService: CoverLetterService,
  ) {}

  async execute(command: GenerateCoverLetterCommand): GenerateCoverLetterResult {
    const jobDescription = await prisma.jobDescription.findFirst({
      where: { id: command.jobDescriptionId, userId: command.userId },
    });
    if (!jobDescription) {
      return Result.err(new Error("Job analysis not found."));
    }

    const [skills, experiences, stories, projects, user] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      prisma.user.findUnique({ where: { id: command.userId }, select: { voiceGuide: true } }),
    ]);
    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);

    let content: string;
    try {
      content = await this.aiService.generate(
        profile,
        jobDescription.company,
        jobDescription.title,
        jobDescription.rawText,
        command.language,
        jobDescription.analyzedData as JobAnalysisData | null,
        command.extraNotes,
        user?.voiceGuide,
      );
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Generation failed."));
    }

    const coverLetterResult = CoverLetter.create({
      userId: command.userId,
      company: jobDescription.company,
      jobTitle: jobDescription.title,
      content,
      language: command.language,
      jobDescriptionId: jobDescription.id,
    });
    if (!coverLetterResult.ok) return Result.err(coverLetterResult.error);

    const saveResult = await this.coverLetterRepo.save(coverLetterResult.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toCoverLetterDTO(coverLetterResult.value));
  }
}
