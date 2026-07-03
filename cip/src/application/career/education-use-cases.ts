import { IEducationRepository } from "../../domain/career/repositories/IEducationRepository";
import { Education, CreateEducationProps, UpdateEducationProps } from "../../domain/career/entities/Education";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { EducationDTO, toEducationDTO } from "../../lib/types/education";

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateEducationUseCase {
  constructor(private readonly repo: IEducationRepository) {}

  async execute(props: CreateEducationProps): AsyncResult<EducationDTO> {
    const result = Education.create(props);
    if (!result.ok) return Result.err(result.error);

    const saveResult = await this.repo.save(result.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toEducationDTO(result.value));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateEducationCommand extends UpdateEducationProps {
  id: string;
  userId: string;
}

export class UpdateEducationUseCase {
  constructor(private readonly repo: IEducationRepository) {}

  async execute(command: UpdateEducationCommand): AsyncResult<EducationDTO> {
    const { id, userId, ...updates } = command;

    const education = await this.repo.findById(id, userId);
    if (!education) return Result.err(new Error("Education entry not found."));

    const updateResult = education.update(updates);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.repo.update(education);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toEducationDTO(education));
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export class DeleteEducationUseCase {
  constructor(private readonly repo: IEducationRepository) {}

  async execute(id: string, userId: string): AsyncResult<void> {
    return this.repo.delete(id, userId);
  }
}

export class ClearAllEducationUseCase {
  constructor(private readonly repo: IEducationRepository) {}

  async execute(userId: string): AsyncResult<void> {
    return this.repo.deleteAllByUserId(userId);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export class GetEducationQuery {
  constructor(private readonly repo: IEducationRepository) {}

  async execute(userId: string): AsyncResult<EducationDTO[]> {
    const education = await this.repo.findByUserId({ userId });
    return Result.ok(education.map(toEducationDTO));
  }
}
