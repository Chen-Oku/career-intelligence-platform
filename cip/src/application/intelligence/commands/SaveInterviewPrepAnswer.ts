import { InterviewPrepAnswerType } from "@prisma/client";
import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import { PRISMA_TYPE_MAP } from "@/lib/types/interviewPrep";
import type { InterviewPrepType } from "@/lib/validators/interviewPrep.schema";

export interface SaveInterviewPrepCommand {
  userId: string;
  type: InterviewPrepType;
  text: string;
}

export type SaveInterviewPrepResult = AsyncResult<void>;

/**
 * SaveInterviewPrepAnswerUseCase
 *
 * Upsert by (userId, type) — one editable answer per type, no version
 * history, same precedent as UpdateProfileText. Writes directly to Prisma;
 * this is a plain single-row upsert with no invariants to enforce.
 */
export class SaveInterviewPrepAnswerUseCase {
  async execute(command: SaveInterviewPrepCommand): SaveInterviewPrepResult {
    try {
      const type: InterviewPrepAnswerType = PRISMA_TYPE_MAP[command.type];
      await prisma.interviewPrepAnswer.upsert({
        where: { userId_type: { userId: command.userId, type } },
        update: { content: command.text },
        create: { userId: command.userId, type, content: command.text },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Could not save."));
    }
  }
}
