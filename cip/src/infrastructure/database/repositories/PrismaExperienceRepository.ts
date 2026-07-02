import type { Experience as PrismaExperience } from "@prisma/client";
import { prisma } from "../client";
import {
  IExperienceRepository,
  FindExperiencesOptions,
} from "../../../domain/career/repositories/IExperienceRepository";
import { Experience, ExperienceProps } from "../../../domain/career/entities/Experience";
import { DateRange } from "../../../domain/career/value-objects/DateRange";
import { Result } from "../../../domain/shared/Result";

/**
 * PrismaExperienceRepository — Infrastructure implementation.
 *
 * This class is the only place in the codebase that knows about:
 * - Prisma
 * - The shape of the database record
 * - How to map between DB records and domain entities
 *
 * The toDomain() mapper is the critical seam. It translates the
 * "database world" (flat record, nullable fields, no business logic)
 * into the "domain world" (rich entity with behaviour and invariants).
 *
 * Security note: every query includes userId in the WHERE clause.
 * This ensures a user can never read, update, or delete another
 * user's data regardless of which id they provide.
 */
export class PrismaExperienceRepository implements IExperienceRepository {
  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.experience.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to clear experiences."));
    }
  }

  async findById(id: string, userId: string): Promise<Experience | null> {
    const record = await prisma.experience.findFirst({
      where: { id, userId },
    });

    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(options: FindExperiencesOptions): Promise<Experience[]> {
    const records = await prisma.experience.findMany({
      where: { userId: options.userId },
      orderBy: [
        { isCurrent: "desc" },   // Current jobs first
        { startDate: "desc" },    // Then most recent
        { order: "asc" },         // Then manual override
      ],
      take: options.limit,
      skip: options.offset,
    });

    return records.map((r) => this.toDomain(r));
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.experience.count({ where: { userId } });
  }

  async save(experience: Experience): Promise<Result<void>> {
    try {
      await prisma.experience.create({
        data: {
          id: experience.id,
          userId: experience.userId,
          company: experience.company,
          position: experience.position,
          industry: experience.industry ?? null,
          location: experience.location ?? null,
          startDate: experience.dateRange.startDate,
          endDate: experience.dateRange.endDate ?? null,
          isCurrent: experience.isCurrent,
          responsibilities: [...experience.responsibilities],
          achievements: [...experience.achievements],
          technologies: [...experience.technologies],
          skills: [...experience.skills],
          hasLeadership: experience.hasLeadership,
          teamSize: experience.teamSize ?? null,
          challenges: experience.challenges ?? null,
          starStory: experience.starStory ?? null,
          portfolioLinks: [...experience.portfolioLinks],
          order: experience.order,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("Failed to save experience.")
      );
    }
  }

  async update(experience: Experience): Promise<Result<void>> {
    try {
      await prisma.experience.update({
        where: { id: experience.id, userId: experience.userId },
        data: {
          company: experience.company,
          position: experience.position,
          industry: experience.industry ?? null,
          location: experience.location ?? null,
          startDate: experience.dateRange.startDate,
          endDate: experience.dateRange.endDate ?? null,
          isCurrent: experience.isCurrent,
          responsibilities: [...experience.responsibilities],
          achievements: [...experience.achievements],
          technologies: [...experience.technologies],
          skills: [...experience.skills],
          hasLeadership: experience.hasLeadership,
          teamSize: experience.teamSize ?? null,
          challenges: experience.challenges ?? null,
          starStory: experience.starStory ?? null,
          portfolioLinks: [...experience.portfolioLinks],
          order: experience.order,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("Failed to update experience.")
      );
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      // deleteMany with userId guard — safe against IDOR attacks
      await prisma.experience.deleteMany({
        where: { id, userId },
      });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(
        error instanceof Error ? error : new Error("Failed to delete experience.")
      );
    }
  }

  // ─── Private Mapper ────────────────────────────────────────────────────────

  private toDomain(record: PrismaExperience): Experience {
    const dateRangeResult = DateRange.create({
      startDate: record.startDate,
      endDate: record.endDate ?? undefined,
      isCurrent: record.isCurrent,
    });

    // If DateRange.create() fails on data that came from our own database,
    // something has gone wrong at the data layer — this is a bug, not a user error.
    if (!dateRangeResult.ok) {
      throw new Error(
        `Corrupt DateRange in database for experience id="${record.id}": ${dateRangeResult.error.message}`
      );
    }

    const props: ExperienceProps = {
      userId: record.userId,
      company: record.company,
      position: record.position,
      industry: record.industry ?? undefined,
      location: record.location ?? undefined,
      dateRange: dateRangeResult.value,
      responsibilities: record.responsibilities,
      achievements: record.achievements,
      technologies: record.technologies,
      skills: record.skills,
      hasLeadership: record.hasLeadership,
      teamSize: record.teamSize ?? undefined,
      challenges: record.challenges ?? undefined,
      starStory: record.starStory ?? undefined,
      portfolioLinks: record.portfolioLinks,
      order: record.order,
    };

    return Experience.reconstitute(props, record.id);
  }
}
