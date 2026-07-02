import type { Skill as PrismaSkill } from "@prisma/client";
import { prisma } from "../client";
import {
  ISkillRepository,
  FindSkillsOptions,
} from "../../../domain/career/repositories/ISkillRepository";
import { Skill, SkillProps, SkillCategory, SkillLevel } from "../../../domain/career/entities/Skill";
import { Result } from "../../../domain/shared/Result";

export class PrismaSkillRepository implements ISkillRepository {
  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.skill.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to clear skills."));
    }
  }

  async findById(id: string, userId: string): Promise<Skill | null> {
    const record = await prisma.skill.findFirst({ where: { id, userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(options: FindSkillsOptions): Promise<Skill[]> {
    const records = await prisma.skill.findMany({
      where: {
        userId: options.userId,
        ...(options.category ? { category: options.category } : {}),
      },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async existsByName(
    userId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const record = await prisma.skill.findFirst({
      where: {
        userId,
        name: { equals: name.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return record !== null;
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.skill.count({ where: { userId } });
  }

  async save(skill: Skill): Promise<Result<void>> {
    try {
      await prisma.skill.create({ data: this.toPersistence(skill) });
      return Result.ok(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async update(skill: Skill): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(skill);
      await prisma.skill.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.skill.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("Failed to delete skill."),
      );
    }
  }

  // ─── Mappers ────────────────────────────────────────────────────────────

  private toDomain(record: PrismaSkill): Skill {
    const props: SkillProps = {
      userId: record.userId,
      name: record.name,
      category: record.category as SkillCategory,
      level: record.level as SkillLevel,
      yearsOfExp: record.yearsOfExp ?? undefined,
      lastUsed: record.lastUsed ?? undefined,
      isPublic: record.isPublic,
      tags: record.tags,
    };
    return Skill.reconstitute(props, record.id);
  }

  private toPersistence(skill: Skill) {
    return {
      id: skill.id,
      userId: skill.userId,
      name: skill.name,
      category: skill.category,
      level: skill.level,
      yearsOfExp: skill.yearsOfExp ?? null,
      lastUsed: skill.lastUsed ?? null,
      isPublic: skill.isPublic,
      tags: [...skill.tags],
    };
  }

  private handleError(error: unknown): Result<void> {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return Result.err(new Error("You already have a skill with that name."));
    }
    return Result.err(
      error instanceof Error ? error : new Error("Database error."),
    );
  }
}
