import type { Project as PrismaProject } from "@prisma/client";
import { prisma } from "../client";
import {
  IProjectRepository,
  FindProjectsOptions,
} from "../../../domain/career/repositories/IProjectRepository";
import { Project, ProjectProps } from "../../../domain/career/entities/Project";
import { Result } from "../../../domain/shared/Result";

export class PrismaProjectRepository implements IProjectRepository {
  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.project.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to clear projects."));
    }
  }

  async findById(id: string, userId: string): Promise<Project | null> {
    const record = await prisma.project.findFirst({ where: { id, userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(options: FindProjectsOptions): Promise<Project[]> {
    const records = await prisma.project.findMany({
      where: {
        userId: options.userId,
        ...(options.highlightedOnly ? { isHighlighted: true } : {}),
      },
      orderBy: [{ isHighlighted: "desc" }, { order: "asc" }, { createdAt: "desc" }],
      take: options.limit,
      skip: options.offset,
    });
    return records.map((r) => this.toDomain(r));
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.project.count({ where: { userId } });
  }

  async save(project: Project): Promise<Result<void>> {
    try {
      await prisma.project.create({ data: this.toPersistence(project) });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to save project."));
    }
  }

  async update(project: Project): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(project);
      await prisma.project.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to update project."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.project.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to delete project."));
    }
  }

  // ─── Mappers ─────────────────────────────────────────────────────────────

  private toDomain(record: PrismaProject): Project {
    const props: ProjectProps = {
      userId: record.userId,
      name: record.name,
      description: record.description,
      goal: record.goal ?? undefined,
      technologies: record.technologies,
      teamSize: record.teamSize ?? undefined,
      myRole: record.myRole ?? undefined,
      challenges: record.challenges ?? undefined,
      results: record.results ?? undefined,
      lessonsLearned: record.lessonsLearned ?? undefined,
      startDate: record.startDate ?? undefined,
      endDate: record.endDate ?? undefined,
      isHighlighted: record.isHighlighted,
      isPublic: record.isPublic,
      tags: record.tags,
      externalUrl: record.externalUrl ?? undefined,
      githubUrl: record.githubUrl ?? undefined,
      order: record.order,
    };
    return Project.reconstitute(props, record.id);
  }

  private toPersistence(project: Project) {
    return {
      id: project.id,
      userId: project.userId,
      name: project.name,
      description: project.description,
      goal: project.goal ?? null,
      technologies: [...project.technologies],
      teamSize: project.teamSize ?? null,
      myRole: project.myRole ?? null,
      challenges: project.challenges ?? null,
      results: project.results ?? null,
      lessonsLearned: project.lessonsLearned ?? null,
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
      isHighlighted: project.isHighlighted,
      isPublic: project.isPublic,
      tags: [...project.tags],
      externalUrl: project.externalUrl ?? null,
      githubUrl: project.githubUrl ?? null,
      order: project.order,
    };
  }
}
