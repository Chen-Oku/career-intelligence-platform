import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { ResumeDefaultsInput } from "@/lib/validators/resume.schema";

export interface UpdateResumeDefaultsCommand {
  userId: string;
  defaults: ResumeDefaultsInput;
}

/**
 * UpdateResumeDefaultsUseCase
 *
 * Direct Prisma write, same precedent as UpdateProfileText: a plain
 * profile blob (contact info) with no invariants beyond the Zod
 * validation already done at the route boundary.
 */
export class UpdateResumeDefaultsUseCase {
  async execute(command: UpdateResumeDefaultsCommand): AsyncResult<void> {
    try {
      await prisma.user.update({
        where: { id: command.userId },
        data: {
          contactInfo: command.defaults.contact,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Could not save."));
    }
  }
}
