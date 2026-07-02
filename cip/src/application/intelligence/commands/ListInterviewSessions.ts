import { IInterviewSessionRepository } from "@/domain/intelligence/repositories/IInterviewSessionRepository";
import { Result, AsyncResult } from "@/domain/shared/Result";
import { toInterviewSessionDTO } from "@/lib/types/interviewSession";
import type { InterviewSessionDTO } from "@/lib/types/interviewSession";

export interface ListInterviewSessionsCommand {
  userId: string;
  jobDescriptionId?: string;
}

export type ListInterviewSessionsResult = AsyncResult<InterviewSessionDTO[]>;

export class ListInterviewSessionsUseCase {
  constructor(private readonly repo: IInterviewSessionRepository) {}

  async execute(command: ListInterviewSessionsCommand): ListInterviewSessionsResult {
    const sessions = command.jobDescriptionId
      ? await this.repo.findByJobDescriptionId(command.jobDescriptionId, command.userId)
      : await this.repo.findByUserId(command.userId);

    return Result.ok(sessions.map(toInterviewSessionDTO));
  }
}
