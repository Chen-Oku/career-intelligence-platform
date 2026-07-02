import type { CoverLetter as PrismaCoverLetter } from "@prisma/client";
import { prisma } from "../client";
import { ICoverLetterRepository } from "../../../domain/document/repositories/ICoverLetterRepository";
import { CoverLetter, CoverLetterProps } from "../../../domain/document/entities/CoverLetter";
import { Result } from "../../../domain/shared/Result";

export class PrismaCoverLetterRepository implements ICoverLetterRepository {
  async findById(id: string, userId: string): Promise<CoverLetter | null> {
    const r = await prisma.coverLetter.findFirst({ where: { id, userId } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserId(userId: string): Promise<CoverLetter[]> {
    const records = await prisma.coverLetter.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(coverLetter: CoverLetter): Promise<Result<void>> {
    try {
      await prisma.coverLetter.create({
        data: {
          id: coverLetter.id,
          userId: coverLetter.userId,
          company: coverLetter.company,
          jobTitle: coverLetter.jobTitle,
          content: coverLetter.content,
          language: coverLetter.language,
          jobDescriptionId: coverLetter.jobDescriptionId ?? null,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to save cover letter."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.coverLetter.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to delete cover letter."));
    }
  }

  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.coverLetter.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to clear cover letters."));
    }
  }

  private toDomain(r: PrismaCoverLetter): CoverLetter {
    const props: CoverLetterProps = {
      userId: r.userId,
      company: r.company,
      jobTitle: r.jobTitle,
      content: r.content,
      language: r.language,
      jobDescriptionId: r.jobDescriptionId ?? undefined,
      createdAt: r.createdAt,
    };
    return CoverLetter.reconstitute(props, r.id);
  }
}
