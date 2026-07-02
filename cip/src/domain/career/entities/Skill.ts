import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// ─── Enums ─────────────────────────────────────────────────────────────────
// Mirrored from Prisma schema. Kept in domain to avoid infrastructure leakage.

export const SkillCategory = {
  TECHNICAL: "TECHNICAL",
  SOFT: "SOFT",
  LANGUAGE: "LANGUAGE",
  FRAMEWORK: "FRAMEWORK",
  METHODOLOGY: "METHODOLOGY",
  LEADERSHIP: "LEADERSHIP",
  AI: "AI",
  DESIGN: "DESIGN",
  PROGRAMMING: "PROGRAMMING",
  OTHER: "OTHER",
} as const;

export type SkillCategory = (typeof SkillCategory)[keyof typeof SkillCategory];

export const SkillLevel = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  EXPERT: "EXPERT",
} as const;

export type SkillLevel = (typeof SkillLevel)[keyof typeof SkillLevel];

/** Ordered levels — useful for sorting and comparison */
export const LEVEL_ORDER: Record<SkillLevel, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
  EXPERT: 3,
};

// ─── Props ─────────────────────────────────────────────────────────────────

export interface SkillProps {
  userId: string;
  name: string;
  category: SkillCategory;
  /** Required for every category except SOFT — soft skills aren't rated by proficiency level. */
  level?: SkillLevel;
  yearsOfExp?: number;
  lastUsed?: Date;
  isPublic: boolean;
  tags: string[];
}

export interface CreateSkillProps {
  userId: string;
  name: string;
  category: SkillCategory;
  level?: SkillLevel;
  yearsOfExp?: number;
  lastUsed?: Date;
  isPublic?: boolean;
  tags?: string[];
}

export type UpdateSkillProps = Partial<Omit<CreateSkillProps, "userId">>;

/**
 * Skill — Domain entity for the Skill Database module.
 *
 * Simpler than Experience or Project. The main invariant is that a user
 * cannot have two skills with the same name — enforced at the database
 * level with @@unique([userId, name]). The repository handles this error
 * and returns a domain-friendly message.
 *
 * No DateRange VO needed — skills have no "current / not current" concept.
 */
export class Skill extends Entity<SkillProps> {
  private constructor(props: SkillProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get category(): SkillCategory { return this.props.category; }
  get level(): SkillLevel | undefined { return this.props.level; }
  get yearsOfExp(): number | undefined { return this.props.yearsOfExp; }
  get lastUsed(): Date | undefined { return this.props.lastUsed; }
  get isPublic(): boolean { return this.props.isPublic; }
  get tags(): readonly string[] { return this.props.tags; }

  // ─── Business Methods ────────────────────────────────────────────────────

  update(updates: UpdateSkillProps): Result<void> {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) return Result.err(new Error("Skill name cannot be empty."));
      this.props.name = updates.name.trim();
    }

    const nextCategory = updates.category ?? this.props.category;
    const nextLevel = updates.level ?? (updates.category !== undefined ? undefined : this.props.level);

    if (nextCategory === SkillCategory.SOFT) {
      this.props.level = undefined;
    } else {
      if (!nextLevel) {
        return Result.err(new Error("Level is required for this skill category."));
      }
      this.props.level = nextLevel;
    }

    if (updates.category !== undefined) this.props.category = updates.category;
    if (updates.yearsOfExp !== undefined) this.props.yearsOfExp = updates.yearsOfExp;
    if (updates.lastUsed !== undefined) this.props.lastUsed = updates.lastUsed;
    if (updates.isPublic !== undefined) this.props.isPublic = updates.isPublic;
    if (updates.tags !== undefined) this.props.tags = updates.tags;
    return Result.ok(undefined);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(props: CreateSkillProps, id?: string): Result<Skill> {
    if (!props.name?.trim()) {
      return Result.err(new Error("Skill name is required."));
    }

    const isSoft = props.category === SkillCategory.SOFT;
    if (!isSoft && !props.level) {
      return Result.err(new Error("Level is required for this skill category."));
    }

    return Result.ok(
      new Skill(
        {
          userId: props.userId,
          name: props.name.trim(),
          category: props.category,
          level: isSoft ? undefined : props.level,
          yearsOfExp: props.yearsOfExp,
          lastUsed: props.lastUsed,
          isPublic: props.isPublic ?? true,
          tags: props.tags ?? [],
        },
        id,
      ),
    );
  }

  static reconstitute(props: SkillProps, id: string): Skill {
    return new Skill(props, id);
  }
}
