import { IExperienceRepository } from "@/domain/career/repositories/IExperienceRepository";
import { ISkillRepository } from "@/domain/career/repositories/ISkillRepository";
import { IStoryRepository } from "@/domain/career/repositories/IStoryRepository";
import { IProjectRepository } from "@/domain/career/repositories/IProjectRepository";
import { CareerAssistantService } from "@/infrastructure/ai/gemini/CareerAssistantService";
import type { AssistantProfileSnapshot } from "@/infrastructure/ai/prompts/assistant.prompts";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { AssistantChatResult, AssistantMessage } from "@/lib/types/assistant";

export interface AssistantChatCommand {
  userId: string;
  message: string;
  language: string;
  history: AssistantMessage[];
}

/**
 * AssistantChatUseCase
 *
 * Orchestration:
 * 1. Fetch the user's career data (userId-scoped repos) in parallel
 * 2. Compress it into a names-only snapshot — the assistant needs it for
 *    deduplication and context, not full detail, and the prompt must stay
 *    small enough to leave room for the pasted text + history
 * 3. Call CareerAssistantService
 *
 * Nothing is persisted: the conversation lives on the client, and
 * suggestions only become data when the user applies them through the
 * section's existing create endpoint.
 */
export class AssistantChatUseCase {
  constructor(
    private readonly experienceRepo: IExperienceRepository,
    private readonly skillRepo: ISkillRepository,
    private readonly storyRepo: IStoryRepository,
    private readonly projectRepo: IProjectRepository,
    private readonly aiService: CareerAssistantService,
  ) {}

  async execute(command: AssistantChatCommand): AsyncResult<AssistantChatResult> {
    const [skills, experiences, stories, projects] = await Promise.all([
      this.skillRepo.findByUserId({ userId: command.userId }),
      this.experienceRepo.findByUserId({ userId: command.userId }),
      this.storyRepo.findByUserId({ userId: command.userId }),
      this.projectRepo.findByUserId({ userId: command.userId }),
    ]);

    // Rich enough for the model to propose UPDATEs (it must return complete
    // arrays, so it needs to see current array contents), but trimmed —
    // long prose fields are cut and stories send metadata only.
    const snapshot: AssistantProfileSnapshot = {
      skills: skills.map((s) => (s.level ? `${s.name} (${s.category}, ${s.level})` : `${s.name} (${s.category})`)),
      experiences: experiences.map((e) => ({
        id: e.id,
        position: e.position,
        company: e.company,
        responsibilities: [...e.responsibilities],
        achievements: [...e.achievements],
        technologies: [...e.technologies],
        skills: [...e.skills],
      })),
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description.length > 240 ? `${p.description.slice(0, 240)}…` : p.description,
        technologies: [...p.technologies],
        results: p.results,
      })),
      stories: stories.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        skills: [...s.skills],
      })),
    };

    try {
      const result = await this.aiService.chat({
        language: command.language,
        message: command.message,
        history: command.history,
        snapshot,
      });
      return Result.ok(result);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Assistant request failed."));
    }
  }
}
