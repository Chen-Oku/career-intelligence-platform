import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

export interface ResumeTypePresetProps {
  userId: string;
  name: string;
  focus: string;
  vocabulary?: string;
  prioritizeKeywords: string[];
  defaultTitle?: string;
}

export interface CreateResumeTypePresetProps {
  userId: string;
  name: string;
  focus: string;
  vocabulary?: string;
  prioritizeKeywords?: string[];
  defaultTitle?: string;
}

export type UpdateResumeTypePresetProps = Partial<Omit<CreateResumeTypePresetProps, "userId">>;

/**
 * ResumeTypePreset — a user-defined resume "angle" (e.g. "Backend Engineer",
 * "ArchViz"), used to tune the generation prompt's focus, vocabulary, and
 * skill-priority keywords. Replaces the old fixed enum: every user builds
 * their own set, by hand or via the "Suggest with AI" review flow. MASTER
 * and CUSTOM are universal built-ins and are never represented as rows here.
 */
export class ResumeTypePreset extends Entity<ResumeTypePresetProps> {
  private constructor(props: ResumeTypePresetProps, id?: string) {
    super(props, id);
  }

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get focus(): string { return this.props.focus; }
  get vocabulary(): string | undefined { return this.props.vocabulary; }
  get prioritizeKeywords(): readonly string[] { return this.props.prioritizeKeywords; }
  get defaultTitle(): string | undefined { return this.props.defaultTitle; }

  update(updates: UpdateResumeTypePresetProps): Result<void> {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) return Result.err(new Error("Preset name is required."));
      this.props.name = updates.name.trim();
    }
    if (updates.focus !== undefined) {
      if (!updates.focus.trim()) return Result.err(new Error("Focus is required."));
      this.props.focus = updates.focus.trim();
    }
    if (updates.vocabulary !== undefined) this.props.vocabulary = updates.vocabulary;
    if (updates.prioritizeKeywords !== undefined) this.props.prioritizeKeywords = updates.prioritizeKeywords;
    if (updates.defaultTitle !== undefined) this.props.defaultTitle = updates.defaultTitle;
    return Result.ok(undefined);
  }

  static create(props: CreateResumeTypePresetProps, id?: string): Result<ResumeTypePreset> {
    if (!props.name?.trim()) return Result.err(new Error("Preset name is required."));
    if (!props.focus?.trim()) return Result.err(new Error("Focus is required."));

    return Result.ok(
      new ResumeTypePreset(
        {
          userId: props.userId,
          name: props.name.trim(),
          focus: props.focus.trim(),
          vocabulary: props.vocabulary,
          prioritizeKeywords: props.prioritizeKeywords ?? [],
          defaultTitle: props.defaultTitle,
        },
        id,
      ),
    );
  }

  static reconstitute(props: ResumeTypePresetProps, id: string): ResumeTypePreset {
    return new ResumeTypePreset(props, id);
  }
}
