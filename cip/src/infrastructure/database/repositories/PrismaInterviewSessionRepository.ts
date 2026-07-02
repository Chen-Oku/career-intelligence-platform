import type { InterviewSession as PrismaInterviewSession } from "@prisma/client";
import { prisma } from "../client";
import { IInterviewSessionRepository } from "../../../domain/intelligence/repositories/IInterviewSessionRepository";
import { InterviewSession, InterviewSessionProps, InterviewSessionType } from "../../../domain/intelligence/entities/InterviewSession";
import { Result } from "../../../domain/shared/Result";

export class PrismaInterviewSessionRepository implements IInterviewSessionRepository {
  async findById(id: string, userId: string): Promise<InterviewSession | null> {
    const record = await prisma.interviewSession.findFirst({ where: { id, userId } });
    return record ? this.toDomain(record) : null;
  }

  async findByUserId(userId: string): Promise<InterviewSession[]> {
    const records = await prisma.interviewSession.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async findByJobDescriptionId(jobDescriptionId: string, userId: string): Promise<InterviewSession[]> {
    const records = await prisma.interviewSession.findMany({
      where: { jobDescriptionId, userId },
      orderBy: { createdAt: "desc" },
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(session: InterviewSession): Promise<Result<void>> {
    try {
      await prisma.interviewSession.create({
        data: {
          id: session.id,
          userId: session.userId,
          jobDescriptionId: session.jobDescriptionId ?? null,
          role: session.role,
          questions: session.questions as object,
          language: session.language,
          sessionType: session.sessionType,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to save interview session."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.interviewSession.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to delete interview session."));
    }
  }

  private toDomain(record: PrismaInterviewSession): InterviewSession {
    const props: InterviewSessionProps = {
      userId: record.userId,
      jobDescriptionId: record.jobDescriptionId ?? undefined,
      role: record.role,
      questions: record.questions as object[],
      language: record.language,
      sessionType: record.sessionType as InterviewSessionType,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    return InterviewSession.reconstitute(props, record.id);
  }
}
