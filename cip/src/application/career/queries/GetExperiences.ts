import {
  IExperienceRepository,
} from "../../../domain/career/repositories/IExperienceRepository";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import { ExperienceDTO, toExperienceDTO } from "../../../lib/types/experience";

export type GetExperiencesResult = AsyncResult<ExperienceDTO[]>;

export class GetExperiencesQuery {
  constructor(
    private readonly experienceRepository: IExperienceRepository,
  ) {}

  async execute(userId: string): GetExperiencesResult {
    const experiences = await this.experienceRepository.findByUserId({ userId });
    return Result.ok(experiences.map(toExperienceDTO));
  }
}
