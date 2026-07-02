import { Entity } from "../../shared/Entity";
import { Result } from "../../shared/Result";

// ─── Props ─────────────────────────────────────────────────────────────────

export interface CertificationProps {
  userId: string;
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
}

export interface CreateCertificationProps {
  userId: string;
  name: string;
  issuer: string;
  issueDate?: Date;
  expiryDate?: Date;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[];
}

export type UpdateCertificationProps = Partial<Omit<CreateCertificationProps, "userId">>;

/**
 * Certification — courses, credentials and licenses.
 *
 * Simple entity in the Skill mold: no DateRange VO because both dates are
 * optional and independent (a credential can have an expiry with no issue
 * date on record). The one invariant: expiry can't precede issue.
 */
export class Certification extends Entity<CertificationProps> {
  private constructor(props: CertificationProps, id?: string) {
    super(props, id);
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get issuer(): string { return this.props.issuer; }
  get issueDate(): Date | undefined { return this.props.issueDate; }
  get expiryDate(): Date | undefined { return this.props.expiryDate; }
  get credentialId(): string | undefined { return this.props.credentialId; }
  get credentialUrl(): string | undefined { return this.props.credentialUrl; }
  get skills(): readonly string[] { return this.props.skills; }

  get isExpired(): boolean {
    return !!this.props.expiryDate && this.props.expiryDate < new Date();
  }

  // ─── Business Methods ────────────────────────────────────────────────────

  update(updates: UpdateCertificationProps): Result<void> {
    if (updates.name !== undefined) {
      if (!updates.name.trim()) return Result.err(new Error("Certification name cannot be empty."));
      this.props.name = updates.name.trim();
    }
    if (updates.issuer !== undefined) {
      if (!updates.issuer.trim()) return Result.err(new Error("Issuer cannot be empty."));
      this.props.issuer = updates.issuer.trim();
    }

    const nextIssue = updates.issueDate !== undefined ? updates.issueDate : this.props.issueDate;
    const nextExpiry = updates.expiryDate !== undefined ? updates.expiryDate : this.props.expiryDate;
    if (nextIssue && nextExpiry && nextExpiry < nextIssue) {
      return Result.err(new Error("Expiry date cannot be before issue date."));
    }

    if (updates.issueDate !== undefined) this.props.issueDate = updates.issueDate;
    if (updates.expiryDate !== undefined) this.props.expiryDate = updates.expiryDate;
    if (updates.credentialId !== undefined) this.props.credentialId = updates.credentialId;
    if (updates.credentialUrl !== undefined) this.props.credentialUrl = updates.credentialUrl;
    if (updates.skills !== undefined) this.props.skills = updates.skills;
    return Result.ok(undefined);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(props: CreateCertificationProps, id?: string): Result<Certification> {
    if (!props.name?.trim()) return Result.err(new Error("Certification name is required."));
    if (!props.issuer?.trim()) return Result.err(new Error("Issuer is required."));
    if (props.issueDate && props.expiryDate && props.expiryDate < props.issueDate) {
      return Result.err(new Error("Expiry date cannot be before issue date."));
    }

    return Result.ok(
      new Certification(
        {
          userId: props.userId,
          name: props.name.trim(),
          issuer: props.issuer.trim(),
          issueDate: props.issueDate,
          expiryDate: props.expiryDate,
          credentialId: props.credentialId,
          credentialUrl: props.credentialUrl,
          skills: props.skills ?? [],
        },
        id,
      ),
    );
  }

  static reconstitute(props: CertificationProps, id: string): Certification {
    return new Certification(props, id);
  }
}
