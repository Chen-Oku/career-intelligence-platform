import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// ─── Props ─────────────────────────────────────────────────────────────────

export interface EducationProps {
  userId: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: Date;
  endDate?: Date;
  isOngoing: boolean;
  skills: string[];
}

export interface CreateEducationProps {
  userId: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: Date;
  endDate?: Date;
  isOngoing?: boolean;
  skills?: string[];
}

export type UpdateEducationProps = Partial<Omit<CreateEducationProps, "userId">>;

/**
 * Education — degrees, diplomas, bootcamps.
 *
 * Simple entity in the Certification mold: no DateRange VO because both
 * dates are optional and independent. The one invariant: endDate can't
 * precede startDate.
 */
export class Education extends Entity<EducationProps> {
  private constructor(props: EducationProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get userId(): string { return this.props.userId; }
  get institution(): string { return this.props.institution; }
  get degree(): string { return this.props.degree; }
  get field(): string | undefined { return this.props.field; }
  get startDate(): Date | undefined { return this.props.startDate; }
  get endDate(): Date | undefined { return this.props.endDate; }
  get isOngoing(): boolean { return this.props.isOngoing; }
  get skills(): readonly string[] { return this.props.skills; }

  // ─── Business Methods ────────────────────────────────────────────────────

  update(updates: UpdateEducationProps): Result<void> {
    if (updates.institution !== undefined) {
      if (!updates.institution.trim()) return Result.err(new Error("Institution cannot be empty."));
      this.props.institution = updates.institution.trim();
    }
    if (updates.degree !== undefined) {
      if (!updates.degree.trim()) return Result.err(new Error("Degree cannot be empty."));
      this.props.degree = updates.degree.trim();
    }

    const nextStart = updates.startDate !== undefined ? updates.startDate : this.props.startDate;
    const nextEnd = updates.endDate !== undefined ? updates.endDate : this.props.endDate;
    if (nextStart && nextEnd && nextEnd < nextStart) {
      return Result.err(new Error("End date cannot be before start date."));
    }

    if (updates.field !== undefined) this.props.field = updates.field;
    if (updates.startDate !== undefined) this.props.startDate = updates.startDate;
    if (updates.endDate !== undefined) this.props.endDate = updates.endDate;
    if (updates.isOngoing !== undefined) this.props.isOngoing = updates.isOngoing;
    if (updates.skills !== undefined) this.props.skills = updates.skills;
    return Result.ok(undefined);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(props: CreateEducationProps, id?: string): Result<Education> {
    if (!props.institution?.trim()) return Result.err(new Error("Institution is required."));
    if (!props.degree?.trim()) return Result.err(new Error("Degree is required."));
    if (props.startDate && props.endDate && props.endDate < props.startDate) {
      return Result.err(new Error("End date cannot be before start date."));
    }

    return Result.ok(
      new Education(
        {
          userId: props.userId,
          institution: props.institution.trim(),
          degree: props.degree.trim(),
          field: props.field,
          startDate: props.startDate,
          endDate: props.endDate,
          isOngoing: props.isOngoing ?? false,
          skills: props.skills ?? [],
        },
        id,
      ),
    );
  }

  static reconstitute(props: EducationProps, id: string): Education {
    return new Education(props, id);
  }
}
