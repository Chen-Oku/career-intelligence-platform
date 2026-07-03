import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// "MASTER"/"CUSTOM" (universal built-ins) or a ResumeTypePreset id
// (per-user preset) — see ResumeTypePreset.ts.
export type ResumeType = string;

export interface ResumeProps {
  userId: string;
  type: ResumeType;
  // Display name resolved at generation time (preset's name, or the
  // built-in's label) — immutable, same as `type`. See typeLabel doc on
  // the Prisma model for why this is denormalized rather than joined.
  typeLabel?: string;
  title: string;
  content: object;           // ResumeContent — typed in lib/types/resume
  contact: object;           // ResumeContact
  targetRole?: string;
  language: string;
  atsScore?: number;
  createdAt: Date;
}

export interface CreateResumeProps {
  userId: string;
  type: ResumeType;
  typeLabel: string;
  title: string;
  content: object;
  contact: object;
  targetRole?: string;
  language?: string;
  atsScore?: number;
}

/**
 * Resume — aggregate root for generated resume documents.
 *
 * Generation (AI) and editing (manual) are separate paths: `create()`
 * produces the initial AI-generated content; `updateContent()` lets the
 * user hand-edit sections afterward (reorder/add/remove experiences,
 * toggle projects, edit text) without another AI call. Editing mutates
 * this same record in place — there is no version history, "edit" really
 * means edit.
 */
export class Resume extends Entity<ResumeProps> {
  private constructor(props: ResumeProps, id?: string) {
    super(props, id);
  }

  get userId(): string        { return this.props.userId; }
  get type(): ResumeType      { return this.props.type; }
  get typeLabel(): string | undefined { return this.props.typeLabel; }
  get title(): string         { return this.props.title; }
  get content(): object       { return this.props.content; }
  get contact(): object       { return this.props.contact; }
  get targetRole(): string | undefined { return this.props.targetRole; }
  get language(): string      { return this.props.language; }
  get atsScore(): number | undefined { return this.props.atsScore; }
  get createdAt(): Date       { return this.props.createdAt; }

  static create(props: CreateResumeProps, id?: string): Result<Resume> {
    if (!props.title?.trim()) {
      return Result.err(new Error("Resume title is required."));
    }
    return Result.ok(
      new Resume(
        {
          ...props,
          title: props.title.trim(),
          language: props.language ?? "en",
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: ResumeProps, id: string): Resume {
    return new Resume(props, id);
  }

  /** Applies a hand-edited version of the content/contact/target role — see class doc. */
  updateContent(content: object, contact: object, targetRole: string | undefined, atsScore: number | undefined): Result<void> {
    this.props.content = content;
    this.props.contact = contact;
    this.props.targetRole = targetRole;
    this.props.atsScore = atsScore;
    return Result.ok(undefined);
  }
}
