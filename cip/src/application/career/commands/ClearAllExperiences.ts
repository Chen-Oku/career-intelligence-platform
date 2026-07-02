import { IExperienceRepository } from "../../../domain/career/repositories/IExperienceRepository";
import { AsyncResult } from "../../../domain/shared/Result";

export class ClearAllExperiencesUseCase {
  constructor(private readonly experienceRepository: IExperienceRepository) {}

  async execute(userId: string): AsyncResult<void> {
    return this.experienceRepository.deleteAllByUserId(userId);
  }
}
