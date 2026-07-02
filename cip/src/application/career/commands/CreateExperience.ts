import {
  IExperienceRepository,
} from "../../../domain/career/repositories/IExperienceRepository";
import {
  Experience,
  CreateExperienceProps,
} from "../../../domain/career/entities/Experience";
import { Result, AsyncResult } from "../../../domain/shared/Result";

// ─── Command ───────────────────────────────────────────────────────────────────
// The input contract for this use case.
// Mirrors CreateExperienceProps exactly here, but they're separate types.
// The command belongs to the application layer; the entity props belong to domain.
// This distinction matters when they diverge (e.g., command might take a string
// date that gets coerced, while the entity always holds a Date object).

export type CreateExperienceCommand = CreateExperienceProps;

// ─── Response ──────────────────────────────────────────────────────────────────
// What the use case returns to the caller (API route, etc.).
// This is a DTO — a plain object, not a domain entity.
// Callers never hold references to domain entities directly.

export interface CreateExperienceResponse {
  id: string;
  company: string;
  position: string;
  isCurrent: boolean;
  durationLabel: string;
  createdAt: Date;
}

export type CreateExperienceResult = AsyncResult<CreateExperienceResponse>;

/**
 * CreateExperienceUseCase — Application layer command handler.
 *
 * Responsibilities:
 * 1. Delegate creation to the domain entity (validates business rules)
 * 2. Persist via the repository interface
 * 3. Return a plain response DTO
 *
 * What it does NOT do:
 * - No direct database access (that's infrastructure's job)
 * - No HTTP concerns (that's the API route's job)
 * - No validation of user input format (that's Zod's job at the API layer)
 *
 * This class has exactly one public method and one responsibility.
 */
export class CreateExperienceUseCase {
  constructor(
    private readonly experienceRepository: IExperienceRepository,
  ) {}

  async execute(command: CreateExperienceCommand): CreateExperienceResult {
    // Step 1: Create the domain entity.
    // All business rules are validated inside Experience.create().
    const experienceResult = Experience.create(command);

    if (!experienceResult.ok) {
      return Result.err(experienceResult.error);
    }

    const experience = experienceResult.value;

    // Step 2: Persist.
    const saveResult = await this.experienceRepository.save(experience);

    if (!saveResult.ok) {
      return Result.err(saveResult.error);
    }

    // Step 3: Return a DTO. We decide what to expose here.
    return Result.ok({
      id: experience.id,
      company: experience.company,
      position: experience.position,
      isCurrent: experience.isCurrent,
      durationLabel: experience.durationLabel,
      createdAt: new Date(),
    });
  }
}
