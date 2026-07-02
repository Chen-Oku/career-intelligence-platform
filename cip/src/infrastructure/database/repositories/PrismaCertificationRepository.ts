import type { Certification as PrismaCertification } from "@prisma/client";
import { prisma } from "../client";
import {
  ICertificationRepository,
  FindCertificationsOptions,
} from "../../../domain/career/repositories/ICertificationRepository";
import { Certification, CertificationProps } from "../../../domain/career/entities/Certification";
import { Result } from "../../../domain/shared/Result";

export class PrismaCertificationRepository implements ICertificationRepository {
  async findById(id: string, userId: string): Promise<Certification | null> {
    const record = await prisma.certification.findFirst({ where: { id, userId } });
    if (!record) return null;
    return this.toDomain(record);
  }

  async findByUserId(options: FindCertificationsOptions): Promise<Certification[]> {
    const records = await prisma.certification.findMany({
      where: { userId: options.userId },
      orderBy: [{ issueDate: "desc" }, { name: "asc" }],
    });
    return records.map((r) => this.toDomain(r));
  }

  async save(certification: Certification): Promise<Result<void>> {
    try {
      await prisma.certification.create({ data: this.toPersistence(certification) });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async update(certification: Certification): Promise<Result<void>> {
    try {
      const { id, userId, ...data } = this.toPersistence(certification);
      await prisma.certification.update({ where: { id, userId }, data });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Database error."));
    }
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    try {
      await prisma.certification.deleteMany({ where: { id, userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to delete certification."));
    }
  }

  async deleteAllByUserId(userId: string): Promise<Result<void>> {
    try {
      await prisma.certification.deleteMany({ where: { userId } });
      return Result.ok(undefined);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to clear certifications."));
    }
  }

  // ─── Mappers ────────────────────────────────────────────────────────────

  private toDomain(record: PrismaCertification): Certification {
    const props: CertificationProps = {
      userId: record.userId,
      name: record.name,
      issuer: record.issuer,
      issueDate: record.issueDate ?? undefined,
      expiryDate: record.expiryDate ?? undefined,
      credentialId: record.credentialId ?? undefined,
      credentialUrl: record.credentialUrl ?? undefined,
      skills: record.skills,
    };
    return Certification.reconstitute(props, record.id);
  }

  private toPersistence(certification: Certification) {
    return {
      id: certification.id,
      userId: certification.userId,
      name: certification.name,
      issuer: certification.issuer,
      issueDate: certification.issueDate ?? null,
      expiryDate: certification.expiryDate ?? null,
      credentialId: certification.credentialId ?? null,
      credentialUrl: certification.credentialUrl ?? null,
      skills: [...certification.skills],
    };
  }
}
