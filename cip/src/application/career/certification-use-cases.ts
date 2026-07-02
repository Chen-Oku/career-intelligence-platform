import { ICertificationRepository } from "../../domain/career/repositories/ICertificationRepository";
import { Certification, CreateCertificationProps, UpdateCertificationProps } from "../../domain/career/entities/Certification";
import { Result, AsyncResult } from "../../domain/shared/Result";
import { CertificationDTO, toCertificationDTO } from "../../lib/types/certification";

// ─── Create ───────────────────────────────────────────────────────────────────

export class CreateCertificationUseCase {
  constructor(private readonly repo: ICertificationRepository) {}

  async execute(props: CreateCertificationProps): AsyncResult<CertificationDTO> {
    const result = Certification.create(props);
    if (!result.ok) return Result.err(result.error);

    const saveResult = await this.repo.save(result.value);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toCertificationDTO(result.value));
  }
}

// ─── Update ───────────────────────────────────────────────────────────────────

export interface UpdateCertificationCommand extends UpdateCertificationProps {
  id: string;
  userId: string;
}

export class UpdateCertificationUseCase {
  constructor(private readonly repo: ICertificationRepository) {}

  async execute(command: UpdateCertificationCommand): AsyncResult<CertificationDTO> {
    const { id, userId, ...updates } = command;

    const certification = await this.repo.findById(id, userId);
    if (!certification) return Result.err(new Error("Certification not found."));

    const updateResult = certification.update(updates);
    if (!updateResult.ok) return Result.err(updateResult.error);

    const saveResult = await this.repo.update(certification);
    if (!saveResult.ok) return Result.err(saveResult.error);

    return Result.ok(toCertificationDTO(certification));
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export class DeleteCertificationUseCase {
  constructor(private readonly repo: ICertificationRepository) {}

  async execute(id: string, userId: string): AsyncResult<void> {
    return this.repo.delete(id, userId);
  }
}

export class ClearAllCertificationsUseCase {
  constructor(private readonly repo: ICertificationRepository) {}

  async execute(userId: string): AsyncResult<void> {
    return this.repo.deleteAllByUserId(userId);
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export class GetCertificationsQuery {
  constructor(private readonly repo: ICertificationRepository) {}

  async execute(userId: string): AsyncResult<CertificationDTO[]> {
    const certifications = await this.repo.findByUserId({ userId });
    return Result.ok(certifications.map(toCertificationDTO));
  }
}
