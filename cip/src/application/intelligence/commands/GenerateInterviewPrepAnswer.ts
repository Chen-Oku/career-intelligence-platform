import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { InterviewPrepService } from "@/infrastructure/ai/gemini/InterviewPrepService";
import { buildCandidateProfileContext } from "@/infrastructure/ai/buildCandidateProfileContext";
import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";
import type { StoryBasedPrepType } from "@/infrastructure/ai/prompts/interviewPrep.prompts";

export interface GenerateInterviewPrepCommand {
  userId: string;
  type: InterviewPrepType;
  language: string;
  guidedAnswers?: { question: string; answer: string }[];
}

export type GenerateInterviewPrepResult = AsyncResult<string>;

// Which Story Bank categories a story-based answer type can draw on — if the
// user has none in these categories, generating would mean fabricating a
// story, so we refuse before ever calling the model.
const STORY_CATEGORIES: Record<StoryBasedPrepType, string[]> = {
  leadershipStory: ["LEADERSHIP", "MENTORING"],
  conflictStory: ["CONFLICT"],
  teamworkStory: ["COMMUNICATION", "ADAPTABILITY", "CUSTOMER_SUCCESS"],
};

const STORY_TYPES: ReadonlySet<InterviewPrepType> = new Set(["leadershipStory", "conflictStory", "teamworkStory"]);

function isStoryBasedType(type: InterviewPrepType): type is StoryBasedPrepType {
  return STORY_TYPES.has(type);
}

/**
 * GenerateInterviewPrepAnswerUseCase
 *
 * Generates a fresh draft only — does not persist (same "Generate / Save /
 * Evaluate" split as GenerateProfileText). Story-based answers refuse to
 * generate if the Story Bank has no story in a relevant category, rather
 * than letting the model invent one.
 */
export class GenerateInterviewPrepAnswerUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: InterviewPrepService,
  ) {}

  async execute(command: GenerateInterviewPrepCommand): GenerateInterviewPrepResult {
    const [skills, experiences, stories, projects, user] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      prisma.user.findUnique({ where: { id: command.userId }, select: { voiceGuide: true } }),
    ]);

    if (isStoryBasedType(command.type)) {
      const relevantCategories = STORY_CATEGORIES[command.type];
      const hasRelevantStory = stories.some((s) => relevantCategories.includes(s.category));
      if (!hasRelevantStory) {
        return Result.err(
          new Error(`Add a story in your Story Bank tagged ${relevantCategories.join(" or ")} before generating this answer.`),
        );
      }
    }

    const profile = buildCandidateProfileContext(skills, experiences, stories, projects);
    const voiceGuide = user?.voiceGuide;

    try {
      let answer: string;
      switch (command.type) {
        case "tellMeAboutYourself":
          answer = await this.aiService.generateTellMeAboutYourself(profile, command.language, command.guidedAnswers, voiceGuide);
          break;
        case "weakness":
          answer = await this.aiService.generateWeakness(profile, command.language, command.guidedAnswers ?? [], voiceGuide);
          break;
        case "salaryExpectations":
          answer = await this.aiService.generateSalaryExpectations(profile, command.language, command.guidedAnswers ?? [], voiceGuide);
          break;
        default:
          answer = await this.aiService.generateStoryBasedAnswer(command.type, profile, command.language, command.guidedAnswers, voiceGuide);
      }
      return Result.ok(answer);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Generation failed."));
    }
  }
}
