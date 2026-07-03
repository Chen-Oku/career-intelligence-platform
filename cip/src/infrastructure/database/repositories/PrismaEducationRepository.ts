import type { EducationEntry as PrismaEducationEntry } from "@prisma/client";
import { prisma } from "../client";
import {
  IEducationRepository,
  FindEducationOptions,
} from "../../../domain/career/repositories/IEducationRepository";
import { Education, EducationProps } from "../../../domain/career/entities/Education";
import { Result } from "../../../domain/shared/Result";

export class PrismaEducationRepository implements IEducationRepository {
  async findById(id: string, userId: string): Promise<Education | null> {
    const record = await prisma.educationEntry.findFirst({ where: { id, userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(options: FindEducationOptions): Promise<Education[]> {
    const records = await prisma.educationEntry.findMany({
      where: { userId: options.userId },
      orderBy: [{ endDate: "desc" }, { institution: "asc" }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(education: Education): Promise<Result<void>> {
    try {
      await prisma.educationEntry.create({ data: this.toPersistence(education) });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async update(education: Education): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(education);
      await prisma.educationEntry.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.educationEntry.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to delete education."));
    }
  }

  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.educationEntry.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to clear education."));
    }
  }

  // ─── Mappers ────────────────────────────────────────────────────────────

  private toDomain(record: PrismaEducationEntry): Education {
    const props: EducationProps = {
      userId: record.userId,
      institution: record.institution,
      degree: record.degree,
      field: record.field ?? undefined,
      startDate: record.startDate ?? undefined,
      endDate: record.endDate ?? undefined,
      isOngoing: record.isOngoing,
      skills: record.skills,
    };
    return Education.reconstitute(props, record.id);
  }

  private toPersistence(education: Education) {
    return {
      id: education.id,
      userId: education.userId,
      institution: education.institution,
      degree: education.degree,
      field: education.field ?? null,
      startDate: education.startDate ?? null,
      endDate: education.endDate ?? null,
      isOngoing: education.isOngoing,
      skills: [...education.skills],
    };
  }
}
