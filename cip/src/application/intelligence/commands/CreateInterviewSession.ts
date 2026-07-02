import { IInterviewSessionRepository } from "@/domain/intelligence/repositories/IInterviewSessionRepository";
import { InterviewSession, InterviewSessionType } from "@/domain/intelligence/entities/InterviewSession";
import { Result, AsyncResult } from "@/domain/shared/Result";
import { toInterviewSessionDTO } from "@/lib/types/interviewSession";
import type { InterviewSessionDTO, InterviewSessionQuestion } from "@/lib/types/interviewSession";

export interface CreateInterviewSessionCommand {
  userId: string;
  jobDescriptionId?: string;
  role: string;
  questions: InterviewSessionQuestion[];
  language: string;
  sessionType: InterviewSessionType;
}

export type CreateInterviewSessionResult = AsyncResult<InterviewSessionDTO>;

/**
 * CreateInterviewSessionUseCase — persists a completed mock-interview
 * walkthrough. No AI call: the walkthrough already produced everything
 * being saved (questions, the candidate's final answers, any feedback).
 */
export class CreateInterviewSessionUseCase {
  constructor(private readonly repo: IInterviewSessionRepository) {}

  async execute(command: CreateInterviewSessionCommand): CreateInterviewSessionResult {
    const created = InterviewSession.create({
      userId: command.userId,
      jobDescriptionId: command.jobDescriptionId,
      role: command.role,
      questions: command.questions,
      language: command.language,
      sessionType: command.sessionType,
    });
    if (!created.ok) return Result.err(created.error);

    const saved = await this.repo.save(created.value);
    if (!saved.ok) return Result.err(saved.error);

    return Result.ok(toInterviewSessionDTO(created.value));
  }
}
