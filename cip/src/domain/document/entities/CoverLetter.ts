import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

export interface CoverLetterProps {
  userId: string;
  company: string;
  jobTitle: string;
  content: string;
  language: string;
  jobDescriptionId?: string;
  createdAt: Date;
}

export interface CreateCoverLetterProps {
  userId: string;
  company: string;
  jobTitle: string;
  content: string;
  language?: string;
  jobDescriptionId?: string;
}

/**
 * CoverLetter — aggregate root for generated cover letter documents.
 *
 * Immutable after creation, same rationale as Resume: if the user wants
 * to change it, they generate a new one against the same (or a refreshed)
 * job posting, preserving history rather than overwriting it.
 */
export class CoverLetter extends Entity<CoverLetterProps> {
  private constructor(props: CoverLetterProps, id?: string) {
    super(props, id);
  }

  get userId(): string { return this.props.userId; }
  get company(): string { return this.props.company; }
  get jobTitle(): string { return this.props.jobTitle; }
  get content(): string { return this.props.content; }
  get language(): string { return this.props.language; }
  get jobDescriptionId(): string | undefined { return this.props.jobDescriptionId; }
  get createdAt(): Date { return this.props.createdAt; }

  static create(props: CreateCoverLetterProps, id?: string): Result<CoverLetter> {
    if (!props.content?.trim()) {
      return Result.err(new Error("Cover letter content is required."));
    }
    if (!props.company?.trim()) {
      return Result.err(new Error("Company is required."));
    }
    if (!props.jobTitle?.trim()) {
      return Result.err(new Error("Job title is required."));
    }
    return Result.ok(
      new CoverLetter(
        {
          ...props,
          company: props.company.trim(),
          jobTitle: props.jobTitle.trim(),
          content: props.content.trim(),
          language: props.language ?? "en",
          createdAt: new Date(),
        },
        id,
      ),
    );
  }

  static reconstitute(props: CoverLetterProps, id: string): CoverLetter {
    return new CoverLetter(props, id);
  }
}
