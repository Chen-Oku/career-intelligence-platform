import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

export const InterviewSessionType = {
  BEHAVIORAL: "BEHAVIORAL",
  TECHNICAL: "TECHNICAL",
  MIXED: "MIXED",
  SALARY: "SALARY",
} as const;

export type InterviewSessionType = (typeof InterviewSessionType)[keyof typeof InterviewSessionType];

export interface InterviewSessionProps {
  userId: string;
  jobDescriptionId?: string;
  role: string;
  // Per-question Q&A — typed in lib/types/interviewSession (InterviewSessionQuestion[]).
  // Kept loose here the same way Resume.content is, since this is a JSON blob with
  // no domain invariants beyond "at least one question".
  questions: object[];
  language: string;
  sessionType: InterviewSessionType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInterviewSessionProps {
  userId: string;
  jobDescriptionId?: string;
  role: string;
  questions: object[];
  language?: string;
  sessionType: InterviewSessionType;
}

/**
 * InterviewSession — a completed mock-interview walkthrough.
 *
 * Immutable after creation, like Resume: a session is a record of what
 * happened, not something the user edits afterward. If they want to
 * practice again, they start a new session.
 */
export class InterviewSession extends Entity<InterviewSessionProps> {
  private constructor(props: InterviewSessionProps, id?: string) {
    super(props, id);
  }

  get userId(): string { return this.props.userId; }
  get jobDescriptionId(): string | undefined { return this.props.jobDescriptionId; }
  get role(): string { return this.props.role; }
  get questions(): readonly object[] { return this.props.questions; }
  get language(): string { return this.props.language; }
  get sessionType(): InterviewSessionType { return this.props.sessionType; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  static create(props: CreateInterviewSessionProps, id?: string): Result<InterviewSession> {
    if (!props.role?.trim()) {
      return Result.err(new Error("Role is required."));
    }
    if (!Array.isArray(props.questions) || props.questions.length === 0) {
      return Result.err(new Error("A session needs at least one question."));
    }

    const now = new Date();
    return Result.ok(
      new InterviewSession(
        {
          userId: props.userId,
          jobDescriptionId: props.jobDescriptionId,
          role: props.role.trim(),
          questions: props.questions,
          language: props.language ?? "en",
          sessionType: props.sessionType,
          createdAt: now,
          updatedAt: now,
        },
        id,
      ),
    );
  }

  static reconstitute(props: InterviewSessionProps, id: string): InterviewSession {
    return new InterviewSession(props, id);
  }
}
