import {
  IExperienceRepository,
} from "../../../domain/career/repositories/IExperienceRepository";
import { Result, AsyncResult } from "../../../domain/shared/Result";

export interface DeleteExperienceCommand {
  id: string;
  userId: string;
}

export type DeleteExperienceResult = AsyncResult<void>;

export class DeleteExperienceUseCase {
  constructor(
    private readonly experienceRepository: IExperienceRepository,
  ) {}

  async execute(command: DeleteExperienceCommand): DeleteExperienceResult {
    // Verify it exists and belongs to this user before deleting.
    // The repository's delete() also includes userId in the WHERE clause,
    // but the explicit check gives us a meaningful error message.
    const experience = await this.experienceRepository.findById(
      command.id,
      command.userId,
    );

    if (!experience) {
      return Result.err(new Error("Experience not found."));
    }

    return this.experienceRepository.delete(command.id, command.userId);
  }
}
