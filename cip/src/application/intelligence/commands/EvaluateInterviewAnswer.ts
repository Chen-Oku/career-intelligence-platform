import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { InterviewCoachService } from "@/infrastructure/ai/gemini/InterviewCoachService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

export interface EvaluateInterviewAnswerCommand {
  userId: string;
  question: string;
  userAnswer: string;
}

export type EvaluateInterviewAnswerResult = AsyncResult<AnswerFeedback>;

/**
 * EvaluateInterviewAnswerUseCase
 *
 * No persistence — this is on-demand coaching feedback, not a saved
 * interview session. Re-fetches the same profile data JobAnalyzerService
 * uses so feedback is grounded in the exact same real facts.
 */
export class EvaluateInterviewAnswerUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: InterviewCoachService,
  ) {}

  async execute(command: EvaluateInterviewAnswerCommand): EvaluateInterviewAnswerResult {
    const [skills, experiences, stories, projects] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
    ]);

    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);

    try {
      const feedback = await this.aiService.evaluateAnswer(command.question, command.userAnswer, profile);
      return Result.ok(feedback);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Evaluation failed."));
    }
  }
}
