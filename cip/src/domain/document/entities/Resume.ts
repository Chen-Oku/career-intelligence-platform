import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

export const ResumeType = {
  MASTER:           "MASTER",
  ARCHVIZ:          "ARCHVIZ",
  GAMEPLAY:         "GAMEPLAY",
  TECHNICAL_ARTIST: "TECHNICAL_ARTIST",
  GRAPHIC_DESIGNER: "GRAPHIC_DESIGNER",
  BTL:              "BTL",
  ENVIRONMENT_ARTIST:"ENVIRONMENT_ARTIST",
  VFX:              "VFX",
  CUSTOM:           "CUSTOM",
} as const;

export type ResumeType = (typeof ResumeType)[keyof typeof ResumeType];

export interface ResumeProps {
  userId: string;
  type: ResumeType;
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
  title: string;
  content: object;
  contact: object;
  targetRole?: string;
  language?: string;
}

/**
 * Resume — aggregate root for generated resume documents.
 *
 * Resume entities are immutable after creation.
 * If the user wants to "edit" a resume, they generate a new one.
 * This preserves the history of generated resumes — the user can
 * compare versions and see how the output changes as they add data.
 */
export class Resume extends Entity<ResumeProps> {
  private constructor(props: ResumeProps, id?: string) {
    super(props, id);
  }

  get userId(): string        { return this.props.userId; }
  get type(): ResumeType      { return this.props.type; }
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
}
