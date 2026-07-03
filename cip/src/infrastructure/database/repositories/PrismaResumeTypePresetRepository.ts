import type { ResumeTypePreset as PrismaResumeTypePreset } from "@prisma/client";
import { prisma } from "../client";
import { IResumeTypePresetRepository } from "../../../domain/document/repositories/IResumeTypePresetRepository";
import { ResumeTypePreset, ResumeTypePresetProps } from "../../../domain/document/entities/ResumeTypePreset";
import { Result } from "../../../domain/shared/Result";

export class PrismaResumeTypePresetRepository implements IResumeTypePresetRepository {
  async findById(id: string, userId: string): Promise<ResumeTypePreset | null> {
    const record = await prisma.resumeTypePreset.findFirst({ where: { id, userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(userId: string): Promise<ResumeTypePreset[]> {
    const records = await prisma.resumeTypePreset.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(preset: ResumeTypePreset): Promise<Result<void>> {
    try {
      await prisma.resumeTypePreset.create({ data: this.toPersistence(preset) });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async update(preset: ResumeTypePreset): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(preset);
      await prisma.resumeTypePreset.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.resumeTypePreset.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to delete preset."));
    }
  }

  // ─── Mappers ────────────────────────────────────────────────────────────

  private toDomain(record: PrismaResumeTypePreset): ResumeTypePreset {
    const props: ResumeTypePresetProps = {
      userId: record.userId,
      name: record.name,
      focus: record.focus,
      vocabulary: record.vocabulary ?? undefined,
      prioritizeKeywords: record.prioritizeKeywords,
      defaultTitle: record.defaultTitle ?? undefined,
    };
    return ResumeTypePreset.reconstitute(props, record.id);
  }

  private toPersistence(preset: ResumeTypePreset) {
    return {
      id: preset.id,
      userId: preset.userId,
      name: preset.name,
      focus: preset.focus,
      vocabulary: preset.vocabulary ?? null,
      prioritizeKeywords: [...preset.prioritizeKeywords],
      defaultTitle: preset.defaultTitle ?? null,
    };
  }
}
