// ─── Repository Interface ─────────────────────────────────────────────────────
// src/domain/career/repositories/IStoryRepository.ts

import { Story, StoryCategory } from "../entities/Story";
import { Result } from "../../shared/Result";

export interface FindStoriesOptions {
  userId: string;
  category?: StoryCategory;
}

export interface IStoryRepository {
  findById(id: string, userId: string): Promise<Story | null>;
  findByUserId(options: FindStoriesOptions): Promise<Story[]>;
  save(story: Story): Promise<Result<void>>;
  update(story: Story): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
