import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProjectProps {
  userId: string;
  name: string;
  description: string;
  goal?: string;
  technologies: string[];
  teamSize?: number;
  myRole?: string;
  challenges?: string;
  results?: string;
  lessonsLearned?: string;
  startDate?: Date;
  endDate?: Date;
  isHighlighted: boolean;
  isPublic: boolean;
  tags: string[];
  externalUrl?: string;
  githubUrl?: string;
  order: number;
}

export type CreateProjectProps = Omit<ProjectProps, "isHighlighted" | "isPublic" | "order"> & {
  isHighlighted?: boolean;
  isPublic?: boolean;
  order?: number;
};

export type UpdateProjectProps = Partial<Omit<CreateProjectProps, "userId">>;

/**
 * Project — Aggregate root for portfolio projects.
 *
 * Simpler than Experience — no DateRange value object needed because
 * project dates are fully optional and carry no complex business rules.
 *
 * Business rules enforced:
 * - Name and description are required
 * - If both dates are provided, endDate cannot precede startDate
 * - Technologies cannot contain duplicates
 */
export class Project extends Entity<ProjectProps> {
  private constructor(props: ProjectProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ───────────────────────────────────────────────────────────────

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get description(): string { return this.props.description; }
  get goal(): string | undefined { return this.props.goal; }
  get technologies(): readonly string[] { return this.props.technologies; }
  get teamSize(): number | undefined { return this.props.teamSize; }
  get myRole(): string | undefined { return this.props.myRole; }
  get challenges(): string | undefined { return this.props.challenges; }
  get results(): string | undefined { return this.props.results; }
  get lessonsLearned(): string | undefined { return this.props.lessonsLearned; }
  get startDate(): Date | undefined { return this.props.startDate; }
  get endDate(): Date | undefined { return this.props.endDate; }
  get isHighlighted(): boolean { return this.props.isHighlighted; }
  get isPublic(): boolean { return this.props.isPublic; }
  get tags(): readonly string[] { return this.props.tags; }
  get externalUrl(): string | undefined { return this.props.externalUrl; }
  get githubUrl(): string | undefined { return this.props.githubUrl; }
  get order(): number { return this.props.order; }

  // ─── Business Methods ──────────────────────────────────────────────────────

  highlight(): void {
    this.props.isHighlighted = true;
  }

  unhighlight(): void {
    this.props.isHighlighted = false;
  }

  update(updates: UpdateProjectProps): Result<void> {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) return Result.err(new Error("Project name cannot be empty."));
      this.props.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      if (!updates.description.trim()) return Result.err(new Error("Description cannot be empty."));
      this.props.description = updates.description.trim();
    }
    if (updates.goal !== undefined) this.props.goal = updates.goal?.trim();
    if (updates.technologies !== undefined) this.props.technologies = updates.technologies;
    if (updates.teamSize !== undefined) this.props.teamSize = updates.teamSize;
    if (updates.myRole !== undefined) this.props.myRole = updates.myRole?.trim();
    if (updates.challenges !== undefined) this.props.challenges = updates.challenges?.trim();
    if (updates.results !== undefined) this.props.results = updates.results?.trim();
    if (updates.lessonsLearned !== undefined) this.props.lessonsLearned = updates.lessonsLearned?.trim();
    if (updates.isHighlighted !== undefined) this.props.isHighlighted = updates.isHighlighted;
    if (updates.isPublic !== undefined) this.props.isPublic = updates.isPublic;
    if (updates.tags !== undefined) this.props.tags = updates.tags;
    if (updates.externalUrl !== undefined) this.props.externalUrl = updates.externalUrl?.trim() || undefined;
    if (updates.githubUrl !== undefined) this.props.githubUrl = updates.githubUrl?.trim() || undefined;
    if (updates.order !== undefined) this.props.order = updates.order;

    // Validate dates if either changed
    const start = updates.startDate ?? this.props.startDate;
    const end = updates.endDate ?? this.props.endDate;
    if (start !== undefined) this.props.startDate = updates.startDate;
    if (end !== undefined) this.props.endDate = updates.endDate;

    if (this.props.startDate && this.props.endDate && this.props.endDate < this.props.startDate) {
      return Result.err(new Error("End date cannot be before start date."));
    }

    return Result.ok(undefined);
  }

  // ─── Factory ──────────────────────────────────────────────────────────────

  static create(props: CreateProjectProps, id?: string): Result<Project> {
    if (!props.name?.trim()) {
      return Result.err(new Error("Project name is required."));
    }
    if (!props.description?.trim()) {
      return Result.err(new Error("Description is required."));
    }
    if (props.startDate && props.endDate && props.endDate < props.startDate) {
      return Result.err(new Error("End date cannot be before start date."));
    }

    return Result.ok(
      new Project(
        {
          userId: props.userId,
          name: props.name.trim(),
          description: props.description.trim(),
          goal: props.goal?.trim(),
          technologies: (props.technologies ?? []).filter(Boolean),
          teamSize: props.teamSize,
          myRole: props.myRole?.trim(),
          challenges: props.challenges?.trim(),
          results: props.results?.trim(),
          lessonsLearned: props.lessonsLearned?.trim(),
          startDate: props.startDate,
          endDate: props.endDate,
          isHighlighted: props.isHighlighted ?? false,
          isPublic: props.isPublic ?? false,
          tags: (props.tags ?? []).filter(Boolean),
          externalUrl: props.externalUrl?.trim() || undefined,
          githubUrl: props.githubUrl?.trim() || undefined,
          order: props.order ?? 0,
        },
        id,
      ),
    );
  }

  static reconstitute(props: ProjectProps, id: string): Project {
    return new Project(props, id);
  }
}
