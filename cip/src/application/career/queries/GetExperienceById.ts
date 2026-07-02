import {
  IExperienceRepository,
} from "../../../domain/career/repositories/IExperienceRepository";
import { Result, AsyncResult } from "../../../domain/shared/Result";
import { ExperienceDTO, toExperienceDTO } from "../../../lib/types/experience";

export interface GetExperienceByIdQuery {
  id: string;
  userId: string;
}

export type GetExperienceByIdResult = AsyncResult<ExperienceDTO>;

export class GetExperienceByIdUseCase {
  constructor(
    private readonly experienceRepository: IExperienceRepository,
  ) {}

  async execute(query: GetExperienceByIdQuery): GetExperienceByIdResult {
    const experience = await this.experienceRepository.findById(
      query.id,
      query.userId,
    );

    if (!experience) {
      return Result.err(new Error("Experience not found."));
    }

    return Result.ok(toExperienceDTO(experience));
  }
}
