import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { InterviewCoachService } from "@/infrastructure/ai/gemini/InterviewCoachService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";

export interface EvaluateInterviewPrepCommand {
  userId: string;
  type: InterviewPrepType;
  draftText: string;
}

export type EvaluateInterviewPrepResult = AsyncResult<AnswerFeedback>;

// These genuinely are interview answers (unlike Profile's About Me/Elevator
// Pitch/Strengths), so InterviewCoachService's STAR-structure rubric applies
// directly — reused as-is via a synthetic question per type.
const SYNTHETIC_QUESTIONS: Record<InterviewPrepType, string> = {
  tellMeAboutYourself: "Tell me about yourself.",
  weakness: "What is your biggest weakness?",
  salaryExpectations: "What are your salary expectations?",
  leadershipStory: "Tell me about a time you led a team or took ownership of a situation.",
  conflictStory: "Tell me about a conflict with a coworker and how you resolved it.",
  teamworkStory: "Tell me about a time you worked effectively as part of a team.",
};

/**
 * EvaluateInterviewPrepAnswerUseCase
 *
 * No persistence — on-demand coaching feedback, reusing
 * InterviewCoachService's existing rubric directly (structure/specificity/
 * relevance) since these answers are literal interview responses, not
 * personal-branding copy like the Profile fields.
 */
export class EvaluateInterviewPrepAnswerUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: InterviewCoachService,
  ) {}

  async execute(command: EvaluateInterviewPrepCommand): EvaluateInterviewPrepResult {
    const [skills, experiences, stories, projects] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
    ]);
    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);

    try {
      const feedback = await this.aiService.evaluateAnswer(
        SYNTHETIC_QUESTIONS[command.type],
        command.draftText,
        profile,
      );
      return Result.ok(feedback);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Evaluation failed."));
    }
  }
}
