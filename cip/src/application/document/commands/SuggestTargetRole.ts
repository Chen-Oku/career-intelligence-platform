import { IResumeRepository } from "../../../domain/document/repositories/IResumeRepository";
import { TargetRoleSuggesterService } from "../../../infrastructure/ai/gemini/TargetRoleSuggesterService";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import type { ResumeContent } from "../../../lib/types/resume";

export interface SuggestTargetRoleCommand {
  id: string;
  userId: string;
}

export type SuggestTargetRoleResult = AsyncResult<string[]>;

/**
 * SuggestTargetRoleUseCase — AI suggestions for the editor's "professional
 * title / target role" field. No persistence: works from the resume's own
 * already-generated content (summary, skills, most recent position) since a
 * Resume has no stored link back to a specific job posting to tailor to.
 */
export class SuggestTargetRoleUseCase {
  constructor(
    private readonly resumeRepo: IResumeRepository,
    private readonly aiService: TargetRoleSuggesterService,
  ) {}

  async execute(command: SuggestTargetRoleCommand): SuggestTargetRoleResult {
    const resume = await this.resumeRepo.findById(command.id, command.userId);
    if (!resume) return Result.err(new Error("Resume not found."));

    const content = resume.content as ResumeContent;

    try {
      const suggestions = await this.aiService.suggest({
        resumeType: resume.type,
        language: resume.language,
        summary: content.summary,
        mostRecentPosition: content.experience[0]?.position,
        skillCategories: content.skills.map((s) => s.category),
        topSkills: content.skills.flatMap((s) => s.items).slice(0, 20),
      });
      return Result.ok(suggestions);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Suggestion failed."));
    }
  }
}
