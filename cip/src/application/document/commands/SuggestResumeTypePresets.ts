import { IExperienceRepository } from "../../../domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "../../../domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "../../../domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "../../../domain/career/repositories/IProjectRepository";
import { IResumeTypePresetRepository } from "../../../domain/document/repositories/IResumeTypePresetRepository";
import { ResumeTypePresetSuggesterService, CandidateResumeTypePreset } from "../../../infrastructure/ai/gemini/ResumeTypePresetSuggesterService";
import { buildCandidateProfileContext } from "../../../infrastructure/ai/buildCandidateProfileContext";
import { Result, AsyncResult } from "../../../domain/shared/Result";

export interface SuggestResumeTypePresetsCommand {
  userId: string;
  language: string;
}

export type SuggestResumeTypePresetsResult = AsyncResult<CandidateResumeTypePreset[]>;

/**
 * SuggestResumeTypePresetsUseCase — AI suggestions for the "resume type
 * presets" settings section. No persistence: candidates are returned for
 * the user to review and selectively add via the existing create-preset
 * endpoint (same precedent as SuggestTargetRoleUseCase).
 */
export class SuggestResumeTypePresetsUseCase {
  constructor(
    private readonly skillRepo: ISkillRepository,
    private readonly experienceRepo: IExperienceRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly presetRepo: IResumeTypePresetRepository,
    private readonly aiService: ResumeTypePresetSuggesterService,
  ) {}

  async execute(command: SuggestResumeTypePresetsCommand): SuggestResumeTypePresetsResult {
    const [skills, experiences, stories, projects, existingPresets] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
      this.presetRepo.findByUserId(command.userId),
    ]);

    const context = buildCandidateProfileContext(skills, experiences, stories, projects);

    try {
      const suggestions = await this.aiService.suggest({
        ...context,
        language: command.language,
        existingPresetNames: existingPresets.map((p) => p.name),
      });
      return Result.ok(suggestions);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Suggestion failed."));
    }
  }
}
