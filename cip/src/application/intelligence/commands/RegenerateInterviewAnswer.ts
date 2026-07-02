import { prisma } from "@/infrastructure/database/client";
import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { JobAnalyzerService } from "@/infrastructure/ai/gemini/JobAnalyzerService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { JobAnalysisData } from "@/lib/types/job";

export interface RegenerateInterviewAnswerCommand {
  userId: string;
  jobDescriptionId: string;
  questionIndex: number;
}

export interface RegenerateInterviewAnswerResultValue {
  questionIndex: number;
  suggestedAnswer: string | null;
}

export type RegenerateInterviewAnswerResult = AsyncResult<RegenerateInterviewAnswerResultValue>;

/**
 * RegenerateInterviewAnswerUseCase
 *
 * Fetches the job's persisted analysis, regenerates one question's
 * suggestedAnswer with a different angle, and writes it back so the
 * better answer survives a page reload. analyzedData is a Json column —
 * Postgres/Prisma can't patch a single array element atomically, so this
 * reads the whole object, mutates one entry, and writes the whole object back.
 */
export class RegenerateInterviewAnswerUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: JobAnalyzerService,
  ) {}

  async execute(command: RegenerateInterviewAnswerCommand): RegenerateInterviewAnswerResult {
    const record = await prisma.jobDescription.findFirst({
      where: { id: command.jobDescriptionId, userId: command.userId },
    });
    if (!record) return Result.err(new Error("Job analysis not found."));

    const analyzedData = record.analyzedData as unknown as JobAnalysisData;
    const target = analyzedData.interviewQuestions[command.questionIndex];
    if (!target) return Result.err(new Error("Question not found."));

    const [skills, experiences, stories, projects] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
    ]);
    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);

    let newAnswer: string | null;
    try {
      newAnswer = await this.aiService.regenerateAnswer(
        target.question,
        target.suggestedAnswer ?? "",
        profile,
        record.language,
      );
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Regeneration failed."));
    }

    const updatedQuestions = analyzedData.interviewQuestions.map((q, i) =>
      i === command.questionIndex ? { ...q, suggestedAnswer: newAnswer } : q,
    );
    const updatedAnalyzedData: JobAnalysisData = { ...analyzedData, interviewQuestions: updatedQuestions };

    await prisma.jobDescription.update({
      where: { id: record.id },
      data: { analyzedData: updatedAnalyzedData as object },
    });

    return Result.ok({ questionIndex: command.questionIndex, suggestedAnswer: newAnswer });
  }
}
