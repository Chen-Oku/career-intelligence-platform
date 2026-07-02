import { ValueObject } from "../../shared/ValueObject";
import { Result } from "../../shared/Result";

interface DateRangeProps {
  startDate: Date;
  endDate?: Date | null;
  isCurrent: boolean;
}

/**
 * DateRange — Value object representing an employment period.
 *
 * Business rules enforced here (not in the database, not in the API):
 * - End date cannot precede start date
 * - A "current" position cannot have an end date
 * - Duration is always calculated from today if isCurrent is true
 *
 * This is the DDD way: rules that belong to the domain live in
 * domain objects, not scattered across API handlers or DB constraints.
 */
export class DateRange extends ValueObject<DateRangeProps> {
  private constructor(props: DateRangeProps) {
    super(props);
  }

  get startDate(): Date {
    return this.props.startDate;
  }

  get endDate(): Date | null | undefined {
    return this.props.endDate;
  }

  get isCurrent(): boolean {
    return this.props.isCurrent;
  }

  get durationInMonths(): number {
    const end = this.props.isCurrent
      ? new Date()
      : (this.props.endDate ?? new Date());

    const months =
      (end.getFullYear() - this.props.startDate.getFullYear()) * 12 +
      (end.getMonth() - this.props.startDate.getMonth());

    return Math.max(0, months);
  }

  get durationLabel(): string {
    const months = this.durationInMonths;
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    const yearLabel = `${years} year${years !== 1 ? "s" : ""}`;
    return rem > 0 ? `${yearLabel} ${rem} month${rem !== 1 ? "s" : ""}` : yearLabel;
  }

  static create(props: DateRangeProps): Result<DateRange> {
    if (props.isCurrent && props.endDate) {
      return Result.err(
        new Error("A current position cannot have an end date.")
      );
    }

    if (!props.isCurrent && props.endDate && props.endDate < props.startDate) {
      return Result.err(
        new Error("End date cannot be before start date.")
      );
    }

    return Result.ok(new DateRange(props));
  }
}
