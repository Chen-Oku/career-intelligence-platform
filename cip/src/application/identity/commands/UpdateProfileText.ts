import { prisma } from "@/infrastructure/database/client";
import { Result, AsyncResult } from "@/domain/shared/Result";
import type { profileFieldSchema } from "@/lib/validators/profile.schema";
import type { z } from "zod";

export interface UpdateProfileTextCommand {
  userId: string;
  field: z.infer<typeof profileFieldSchema>;
  text: string;
}

export type UpdateProfileTextResult = AsyncResult<void>;

/**
 * UpdateProfileTextUseCase
 *
 * Writes directly to Prisma — no IUserRepository. This is a plain
 * text-field update with no invariants to enforce, the same precedent as
 * AnalyzeJobDescription's direct write. Revisit if User accumulates
 * more owned behavior beyond these profile text fields.
 */
export class UpdateProfileTextUseCase {
  async execute(command: UpdateProfileTextCommand): UpdateProfileTextResult {
    try {
      await prisma.user.update({
        where: { id: command.userId },
        data: { [command.field]: command.text },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Could not save."));
    }
  }
}
