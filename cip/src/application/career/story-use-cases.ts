// ─── Use Cases ────────────────────────────────────────────────────────────────

import { IStoryRepository } from "../../domain/career/repositories/IStoryRepository";
import { Story, CreateStoryProps, UpdateStoryProps } from "../../domain/career/entities/Story";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { StoryDTO, toStoryDTO } from "../../lib/types/story";

export class CreateStoryUseCase {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(props: CreateStoryProps): AsyncResult<StoryDTO> {
    const result = Story.create(props);
    if (!result.ok) return Result.err(result.error);
    const save = await this.repo.save(result.value);
    if (!save.ok) return Result.err(save.error);
    return Result.ok(toStoryDTO(result.value));
  }
}

export interface UpdateStoryCommand extends UpdateStoryProps { id: string; userId: string; }
export class UpdateStoryUseCase {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(command: UpdateStoryCommand): AsyncResult<StoryDTO> {
    const { id, userId, ...updates } = command;
    const story = await this.repo.findById(id, userId);
    if (!story) return Result.err(new Error("Story not found."));
    const update = story.update(updates);
    if (!update.ok) return Result.err(update.error);
    const save = await this.repo.update(story);
    if (!save.ok) return Result.err(save.error);
    return Result.ok(toStoryDTO(story));
  }
}

export class DeleteStoryUseCase {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(id: string, userId: string): AsyncResult<void> {
    const story = await this.repo.findById(id, userId);
    if (!story) return Result.err(new Error("Story not found."));
    return this.repo.delete(id, userId);
  }
}

export class ClearAllStoriesUseCase {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(userId: string): AsyncResult<void> {
    return this.repo.deleteAllByUserId(userId);
  }
}

export class GetStoriesQuery {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(userId: string): AsyncResult<StoryDTO[]> {
    const stories = await this.repo.findByUserId({ userId });
    return Result.ok(stories.map(toStoryDTO));
  }
}

export class GetStoryByIdUseCase {
  constructor(private readonly repo: IStoryRepository) {}
  async execute(id: string, userId: string): AsyncResult<StoryDTO> {
    const story = await this.repo.findById(id, userId);
    if (!story) return Result.err(new Error("Story not found."));
    return Result.ok(toStoryDTO(story));
  }
}
