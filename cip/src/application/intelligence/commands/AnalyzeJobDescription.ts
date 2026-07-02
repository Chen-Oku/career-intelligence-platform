import { prisma } from "@/infrastructure/database/client";
import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { JobAnalyzerService } from "@/infrastructure/ai/gemini/JobAnalyzerService";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { JobDescriptionDTO, JobAnalysisData } from "@/lib/types/job";

export interface AnalyzeJobCommand {
  userId: string;
  company: string;
  title: string;
  rawText: string;
  language: string;
}

export type AnalyzeJobResult = AsyncResult<JobDescriptionDTO>;

/**
 * AnalyzeJobDescriptionUseCase
 *
 * Orchestration:
 * 1. Fetch user's skills, experiences, stories in parallel
 * 2. Call JobAnalyzerService (Gemini + deterministic match scoring)
 * 3. Persist to JobDescription table
 * 4. Return DTO
 *
 * We write directly to Prisma here (not through a repository)
 * because JobDescription is simple enough that a full repository
 * would add ceremony without value for the use case we need.
 * If it grows complex, extract PrismaJobDescriptionRepository.
 */
export class AnalyzeJobDescriptionUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: JobAnalyzerService,
  ) {}

  async execute(command: AnalyzeJobCommand): AnalyzeJobResult {
    // 1. Require at least skills to do a meaningful match
    const [skills, experiences, stories, projects] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
    ]);

    // 2. Run AI analysis + deterministic match scoring
    let analysis: JobAnalysisData;
    try {
      analysis = await this.aiService.analyze(
        command.rawText,
        command.language,
        skills,
        experiences,
        stories,
        projects,
      );
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("Analysis failed."),
      );
    }

    // 3. Persist — use the extracted role/company if user didn't provide them
    const company = command.company.trim() || analysis.extractedCompany || "Unknown Company";
    const title   = command.title.trim()   || analysis.extractedRole    || "Unknown Role";

    const record = await prisma.jobDescription.create({
      data: {
        userId:       command.userId,
        company,
        title,
        rawText:      command.rawText,
        analyzedData: analysis as object,
        matchScore:   analysis.matchScore,
        missingSkills:analysis.missingSkills,
        language:     command.language,
      },
    });

    return Result.ok({
      id:            record.id,
      company:       record.company,
      title:         record.title,
      rawText:       record.rawText,
      analyzedData:  analysis,
      matchScore:    analysis.matchScore,
      missingSkills: analysis.missingSkills,
      language:      record.language,
      createdAt:     record.createdAt.toISOString(),
    });
  }
}
