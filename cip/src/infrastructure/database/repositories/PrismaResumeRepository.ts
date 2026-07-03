import type { Resume as PrismaResume } from "@prisma/client";
import { prisma } from "../client";
import { IResumeRepository } from "../../../domain/document/repositories/IResumeRepository";
import { Resume, ResumeProps, ResumeType } from "../../../domain/document/entities/Resume";
import { Result } from "../../../domain/shared/Result";

export class PrismaResumeRepository implements IResumeRepository {
  async findById(id: string, userId: string): Promise<Resume | null> {
    const r = await prisma.resume.findFirst({ where: { id, userId } });
    return r ? this.toDomain(r) : null;
  }

  async findByUserId(userId: string): Promise<Resume[]> {
    const records = await prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(resume: Resume): Promise<Result<void>> {
    try {
      await prisma.resume.create({
        data: {
          id: resume.id,
          userId: resume.userId,
          type: resume.type,
          title: resume.title,
          content: resume.content as object,
          targetRole: resume.targetRole ?? null,
          language: resume.language,
          atsScore: resume.atsScore ?? null,
          isActive: true,
          // Store contact in a separate JSON field or in content
          // For MVP, we add contact to content directly
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to save resume."));
    }
  }

  async update(resume: Resume): Promise<Result<void>> {
    try {
      await prisma.resume.updateMany({
        where: { id: resume.id, userId: resume.userId },
        data: {
          content: { ...(resume.content as object), contact: resume.contact } as object,
          targetRole: resume.targetRole ?? null,
          atsScore: resume.atsScore ?? null,
        },
      });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to update resume."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.resume.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to delete resume."));
    }
  }

  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.resume.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error("Failed to clear resumes."));
    }
  }

  private toDomain(r: PrismaResume): Resume {
    // Contact is stored inside content.contact for simplicity
    const fullContent = r.content as Record<string, unknown>;
    const contact = (fullContent?.contact as object) ?? {};
    const content = { ...fullContent };
    delete (content as Record<string, unknown>).contact;

    const props: ResumeProps = {
      userId: r.userId,
      type: r.type as ResumeType,
      title: r.title,
      content: content as object,
      contact,
      targetRole: r.targetRole ?? undefined,
      language: r.language,
      atsScore: r.atsScore ?? undefined,
      createdAt: r.createdAt,
    };
    return Resume.reconstitute(props, r.id);
  }
}
