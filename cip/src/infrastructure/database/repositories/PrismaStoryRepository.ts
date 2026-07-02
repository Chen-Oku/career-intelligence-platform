import type { Story as PrismaStory } from "@prisma/client";
import { prisma } from "../client";
import { IStoryRepository, FindStoriesOptions } from "../../../domain/career/repositories/IStoryRepository";
import { Story, StoryProps, StoryCategory } from "../../../domain/career/entities/Story";
import { Result } from "../../../domain/shared/Result";

export class PrismaStoryRepository implements IStoryRepository {
  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.story.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to clear stories."));
    }
  }

  async findById(id: string, userId: string): Promise<Story | null> {
    const r = await prisma.story.findFirst({ where: { id, userId } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserId(options: FindStoriesOptions): Promise<Story[]> {
    const records = await prisma.story.findMany({
      where: { userId: options.userId, ...(options.category ? { category: options.category } : {}) },
      orderBy: [{ category: "asc" }, { createdAt: "desc" }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(story: Story): Promise<Result<void>> {
    try {
      await prisma.story.create({ data: this.toPersistence(story) });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to save story."));
    }
  }

  async update(story: Story): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(story);
      await prisma.story.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to update story."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.story.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to delete story."));
    }
  }

  private toDomain(r: PrismaStory): Story {
    const props: StoryProps = {
      userId: r.userId, title: r.title,
      category: r.category as StoryCategory,
      situation: r.situation, task: r.task, action: r.action, result: r.result,
      impact: r.impact ?? undefined, skills: r.skills, keywords: r.keywords,
    };
    return Story.reconstitute(props, r.id);
  }

  private toPersistence(s: Story) {
    return {
      id: s.id, userId: s.userId, title: s.title, category: s.category,
      situation: s.situation, task: s.task, action: s.action, result: s.result,
      impact: s.impact ?? null, skills: [...s.skills], keywords: [...s.keywords],
    };
  }
}
