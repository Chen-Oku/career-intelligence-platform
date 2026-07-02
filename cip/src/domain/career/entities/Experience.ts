import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";
import { DateRange } from "../value-objects/DateRange";

// ─── Internal Props ────────────────────────────────────────────────────────────
// These are the properties managed by the entity internally.
// External code interacts only through getters and methods.

export interface ExperienceProps {
  userId: string;
  company: string;
  position: string;
  industry?: string;
  location?: string;
  dateRange: DateRange;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  skills: string[];
  hasLeadership: boolean;
  teamSize?: number;
  challenges?: string;
  starStory?: string;
  portfolioLinks: string[];
  order: number;
}

// ─── Command Input ─────────────────────────────────────────────────────────────
// What callers provide to CREATE a new Experience.
// Note: dateRange decomposed into primitives — callers shouldn't
// need to know about value objects.

export interface CreateExperienceProps {
  userId: string;
  company: string;
  position: string;
  industry?: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrent: boolean;
  responsibilities: string[];
  achievements?: string[];
  technologies?: string[];
  skills?: string[];
  hasLeadership?: boolean;
  teamSize?: number;
  challenges?: string;
  starStory?: string;
  portfolioLinks?: string[];
  order?: number;
}

// ─── Update Input ──────────────────────────────────────────────────────────────

export type UpdateExperienceProps = Partial<Omit<CreateExperienceProps, "userId">>;

/**
 * Experience — Aggregate Root for the Career Context.
 *
 * This is the most important entity in the system.
 * It owns: responsibilities, achievements, technologies, skills,
 * and the STAR story. These feed every AI output.
 *
 * Rules enforced here:
 * - Company and position are required and non-empty
 * - At least one responsibility must be provided
 * - Date range is always valid (delegated to DateRange VO)
 * - Skills cannot contain duplicates
 * - Achievements are trimmed before storage
 */
export class Experience extends Entity<ExperienceProps> {
  private constructor(props: ExperienceProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  get userId(): string { return this.props.userId; }
  get company(): string { return this.props.company; }
  get position(): string { return this.props.position; }
  get industry(): string | undefined { return this.props.industry; }
  get location(): string | undefined { return this.props.location; }
  get dateRange(): DateRange { return this.props.dateRange; }
  get responsibilities(): readonly string[] { return this.props.responsibilities; }
  get achievements(): readonly string[] { return this.props.achievements; }
  get technologies(): readonly string[] { return this.props.technologies; }
  get skills(): readonly string[] { return this.props.skills; }
  get hasLeadership(): boolean { return this.props.hasLeadership; }
  get teamSize(): number | undefined { return this.props.teamSize; }
  get challenges(): string | undefined { return this.props.challenges; }
  get starStory(): string | undefined { return this.props.starStory; }
  get portfolioLinks(): readonly string[] { return this.props.portfolioLinks; }
  get order(): number { return this.props.order; }

  // ─── Computed ──────────────────────────────────────────────────────────────

  get isCurrent(): boolean {
    return this.props.dateRange.isCurrent;
  }

  get durationInMonths(): number {
    return this.props.dateRange.durationInMonths;
  }

  get durationLabel(): string {
    return this.props.dateRange.durationLabel;
  }

  // ─── Business Methods ──────────────────────────────────────────────────────
  // Mutations go through methods so business rules are always enforced.
  // Never mutate props directly from outside.

  addAchievement(achievement: string): Result<void> {
    const trimmed = achievement.trim();
    if (!trimmed) {
      return Result.err(new Error("Achievement cannot be empty."));
    }
    this.props.achievements.push(trimmed);
    return Result.ok(undefined);
  }

  addSkill(skill: string): Result<void> {
    const trimmed = skill.trim();
    const exists = this.props.skills.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return Result.err(new Error(`Skill "${trimmed}" already exists on this experience.`));
    }
    this.props.skills.push(trimmed);
    return Result.ok(undefined);
  }

  update(props: UpdateExperienceProps): Result<void> {
    if (props.company !== undefined) {
      if (!props.company.trim()) return Result.err(new Error("Company cannot be empty."));
      this.props.company = props.company.trim();
    }
    if (props.position !== undefined) {
      if (!props.position.trim()) return Result.err(new Error("Position cannot be empty."));
      this.props.position = props.position.trim();
    }
    if (props.industry !== undefined) this.props.industry = props.industry?.trim();
    if (props.location !== undefined) this.props.location = props.location?.trim();
    if (props.responsibilities !== undefined) {
      if (props.responsibilities.length === 0) {
        return Result.err(new Error("At least one responsibility is required."));
      }
      this.props.responsibilities = props.responsibilities.filter((r) => r.trim());
    }
    if (props.achievements !== undefined) {
      this.props.achievements = props.achievements.filter((a) => a.trim());
    }
    if (props.technologies !== undefined) {
      this.props.technologies = props.technologies.filter((t) => t.trim());
    }
    if (props.skills !== undefined) {
      this.props.skills = props.skills.filter((s) => s.trim());
    }
    if (props.hasLeadership !== undefined) this.props.hasLeadership = props.hasLeadership;
    if (props.teamSize !== undefined) this.props.teamSize = props.teamSize;
    if (props.challenges !== undefined) this.props.challenges = props.challenges?.trim();
    if (props.starStory !== undefined) this.props.starStory = props.starStory?.trim();
    if (props.portfolioLinks !== undefined) this.props.portfolioLinks = props.portfolioLinks;
    if (props.order !== undefined) this.props.order = props.order;

    // If date fields are changing, re-validate the date range
    if (
      props.startDate !== undefined ||
      props.endDate !== undefined ||
      props.isCurrent !== undefined
    ) {
      const dateRangeResult = DateRange.create({
        startDate: props.startDate ?? this.props.dateRange.startDate,
        endDate: props.endDate ?? this.props.dateRange.endDate ?? undefined,
        isCurrent: props.isCurrent ?? this.props.dateRange.isCurrent,
      });
      if (!dateRangeResult.ok) return Result.err(dateRangeResult.error);
      this.props.dateRange = dateRangeResult.value;
    }

    return Result.ok(undefined);
  }

  // ─── Factory Methods ───────────────────────────────────────────────────────

  /**
   * create() — Use when creating a NEW experience.
   * Validates all business rules. Returns Result so callers
   * handle failure explicitly.
   */
  static create(props: CreateExperienceProps, id?: string): Result<Experience> {
    if (!props.company?.trim()) {
      return Result.err(new Error("Company name is required."));
    }
    if (!props.position?.trim()) {
      return Result.err(new Error("Position is required."));
    }
    if (!props.responsibilities?.length) {
      return Result.err(new Error("At least one responsibility is required."));
    }

    const dateRangeResult = DateRange.create({
      startDate: props.startDate,
      endDate: props.endDate,
      isCurrent: props.isCurrent,
    });

    if (!dateRangeResult.ok) {
      return Result.err(dateRangeResult.error);
    }

    return Result.ok(
      new Experience(
        {
          userId: props.userId,
          company: props.company.trim(),
          position: props.position.trim(),
          industry: props.industry?.trim(),
          location: props.location?.trim(),
          dateRange: dateRangeResult.value,
          responsibilities: props.responsibilities.map((r) => r.trim()).filter(Boolean),
          achievements: (props.achievements ?? []).map((a) => a.trim()).filter(Boolean),
          technologies: (props.technologies ?? []).map((t) => t.trim()).filter(Boolean),
          skills: (props.skills ?? []).map((s) => s.trim()).filter(Boolean),
          hasLeadership: props.hasLeadership ?? false,
          teamSize: props.teamSize,
          challenges: props.challenges?.trim(),
          starStory: props.starStory?.trim(),
          portfolioLinks: (props.portfolioLinks ?? []).filter(Boolean),
          order: props.order ?? 0,
        },
        id,
      ),
    );
  }

  /**
   * reconstitute() — Use when loading from the database.
   * Skips validation because the data was already valid when saved.
   * Requires an explicit id — never called without one from DB.
   */
  static reconstitute(props: ExperienceProps, id: string): Experience {
    return new Experience(props, id);
  }
}
