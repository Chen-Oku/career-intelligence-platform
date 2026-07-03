import { IResumeTypePresetRepository } from "../../domain/document/repositories/IResumeTypePresetRepository";
import { ResumeTypePreset, CreateResumeTypePresetProps, UpdateResumeTypePresetProps } from "../../domain/document/entities/ResumeTypePreset";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { ResumeTypePresetDTO, toResumeTypePresetDTO } from "../../lib/types/resumeTypePreset";

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateResumeTypePresetUseCase {
  constructor(private readonly repo: IResumeTypePresetRepository) {}

  async execute(props: CreateResumeTypePresetProps): AsyncResult<ResumeTypePresetDTO> {
    const result = ResumeTypePreset.create(props);
    if (!result.ok) return Result.err(result.error);

    const saveResult = await this.repo.save(result.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toResumeTypePresetDTO(result.value));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateResumeTypePresetCommand extends UpdateResumeTypePresetProps {
  id: string;
  userId: string;
}

export class UpdateResumeTypePresetUseCase {
  constructor(private readonly repo: IResumeTypePresetRepository) {}

  async execute(command: UpdateResumeTypePresetCommand): AsyncResult<ResumeTypePresetDTO> {
    const { id, userId, ...updates } = command;

    const preset = await this.repo.findById(id, userId);
    if (!preset) return Result.err(new Error("Resume type preset not found."));

    const updateResult = preset.update(updates);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.repo.update(preset);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toResumeTypePresetDTO(preset));
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export class DeleteResumeTypePresetUseCase {
  constructor(private readonly repo: IResumeTypePresetRepository) {}

  async execute(id: string, userId: string): AsyncResult<void> {
    return this.repo.delete(id, userId);
  }
}

// ─── Query ──────────────────────────────────────────────────────────────────

export class GetResumeTypePresetsQuery {
  constructor(private readonly repo: IResumeTypePresetRepository) {}

  async execute(userId: string): AsyncResult<ResumeTypePresetDTO[]> {
    const presets = await this.repo.findByUserId(userId);
    return Result.ok(presets.map(toResumeTypePresetDTO));
  }
}
