import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const StoryCategory = {
  LEADERSHIP:         "LEADERSHIP",
  CONFLICT:           "CONFLICT",
  INNOVATION:         "INNOVATION",
  FAILURE:            "FAILURE",
  PROBLEM_SOLVING:    "PROBLEM_SOLVING",
  COMMUNICATION:      "COMMUNICATION",
  ADAPTABILITY:       "ADAPTABILITY",
  LEARNING:           "LEARNING",
  MENTORING:          "MENTORING",
  CUSTOMER_SUCCESS:   "CUSTOMER_SUCCESS",
  PROJECT_MANAGEMENT: "PROJECT_MANAGEMENT",
} as const;

export type StoryCategory = (typeof StoryCategory)[keyof typeof StoryCategory];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StoryProps {
  userId: string;
  title: string;
  category: StoryCategory;
  /** S — What was the context? */
  situation: string;
  /** T — What was your specific responsibility? */
  task: string;
  /** A — What did you do? (be specific and active voice) */
  action: string;
  /** R — What happened as a result? */
  result: string;
  /** Optional: quantified impact. "Reduced time by 40%" */
  impact?: string;
  skills: string[];
  keywords: string[];
}

export type CreateStoryProps = StoryProps;
export type UpdateStoryProps = Partial<Omit<CreateStoryProps, "userId">>;

/**
 * Story — STAR story aggregate root.
 *
 * Every field of the STAR format is required. Half-finished stories
 * are worse than no stories from the AI's perspective — they produce
 * incomplete interview answers.
 *
 * The `keywords` field is intentional: it gives the AI surface area
 * for retrieval. When a job description mentions "cross-functional
 * collaboration", keywords like "multidisciplinary", "client-facing",
 * "team alignment" help match the right story.
 */
export class Story extends Entity<StoryProps> {
  private constructor(props: StoryProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get userId(): string     { return this.props.userId; }
  get title(): string      { return this.props.title; }
  get category(): StoryCategory { return this.props.category; }
  get situation(): string  { return this.props.situation; }
  get task(): string       { return this.props.task; }
  get action(): string     { return this.props.action; }
  get result(): string     { return this.props.result; }
  get impact(): string | undefined { return this.props.impact; }
  get skills(): readonly string[] { return this.props.skills; }
  get keywords(): readonly string[] { return this.props.keywords; }

  // ─── Business Methods ────────────────────────────────────────────────────

  update(updates: UpdateStoryProps): Result<void> {
    if (updates.title !== undefined) {
      if (!updates.title.trim()) return Result.err(new Error("Title cannot be empty."));
      this.props.title = updates.title.trim();
    }
    if (updates.category !== undefined) this.props.category = updates.category;

    const starFields = ["situation", "task", "action", "result"] as const;
    for (const field of starFields) {
      if (updates[field] !== undefined) {
        if (!updates[field]!.trim()) {
          return Result.err(new Error(`${field} cannot be empty.`));
        }
        this.props[field] = updates[field]!.trim();
      }
    }

    if (updates.impact !== undefined) this.props.impact = updates.impact?.trim() || undefined;
    if (updates.skills !== undefined) this.props.skills = updates.skills;
    if (updates.keywords !== undefined) this.props.keywords = updates.keywords;

    return Result.ok(undefined);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(props: CreateStoryProps, id?: string): Result<Story> {
    const required: Array<keyof CreateStoryProps> = ["title", "situation", "task", "action", "result"];
    for (const field of required) {
      const val = props[field] as string | undefined;
      if (!val?.trim()) {
        return Result.err(new Error(`${field.charAt(0).toUpperCase() + field.slice(1)} is required.`));
      }
    }

    return Result.ok(
      new Story(
        {
          userId: props.userId,
          title: props.title.trim(),
          category: props.category,
          situation: props.situation.trim(),
          task: props.task.trim(),
          action: props.action.trim(),
          result: props.result.trim(),
          impact: props.impact?.trim() || undefined,
          skills: props.skills ?? [],
          keywords: props.keywords ?? [],
        },
        id,
      ),
    );
  }

  static reconstitute(props: StoryProps, id: string): Story {
    return new Story(props, id);
  }
}
