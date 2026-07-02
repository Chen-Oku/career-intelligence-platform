import {
  IExperienceRepository,
} from "../../../domain/career/repositories/IExperienceRepository";
import { UpdateExperienceProps } from "../../../domain/career/entities/Experience";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import { ExperienceDTO, toExperienceDTO } from "../../../lib/types/experience";

export interface UpdateExperienceCommand extends UpdateExperienceProps {
  id: string;
  userId: string;
}

export type UpdateExperienceResult = AsyncResult<ExperienceDTO>;

export class UpdateExperienceUseCase {
  constructor(
    private readonly experienceRepository: IExperienceRepository,
  ) {}

  async execute(command: UpdateExperienceCommand): UpdateExperienceResult {
    const { id, userId, ...updates } = command;

    // 1. Load existing entity — confirms ownership via userId
    const experience = await this.experienceRepository.findById(id, userId);

    if (!experience) {
      return Result.err(new Error("Experience not found."));
    }

    // 2. Apply changes through the domain entity's own method.
    //    This ensures all business rules are re-evaluated on update.
    const updateResult = experience.update(updates);

    if (!updateResult.ok) {
      return Result.err(updateResult.error);
    }

    // 3. Persist the mutated entity
    const saveResult = await this.experienceRepository.update(experience);

    if (!saveResult.ok) {
      return Result.err(saveResult.error);
    }

    return Result.ok(toExperienceDTO(experience));
  }
}
