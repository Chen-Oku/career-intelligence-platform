import { Experience } from "../entities/Experience";
import { Result } from "../../shared/Result";

export interface FindExperiencesOptions {
  userId: string;
  limit?: number;
  offset?: number;
}

/**
 * IExperienceRepository — Repository interface (port).
 *
 * Why a separate interface?
 * The domain layer defines WHAT it needs from persistence.
 * The infrastructure layer decides HOW to implement it.
 *
 * This is the Dependency Inversion Principle in practice:
 * - Domain depends on IExperienceRepository (abstraction)
 * - Infrastructure implements IExperienceRepository (detail)
 * - Domain never imports from infrastructure
 *
 * This means we can swap Prisma for anything else (Drizzle, raw SQL,
 * a different database) without touching domain or application code.
 * It also means we can inject a fake in-memory repository for unit tests.
 */
export interface IExperienceRepository {
  findById(id: string, userId: string): Promise<Experience | null>;
  findByUserId(options: FindExperiencesOptions): Promise<Experience[]>;
  countByUserId(userId: string): Promise<number>;
  save(experience: Experience): Promise<Result<void>>;
  update(experience: Experience): Promise<Result<void>>;
  delete(id: string, userId: string): Promise<Result<void>>;
  deleteAllByUserId(userId: string): Promise<Result<void>>;
}
