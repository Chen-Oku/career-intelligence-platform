import { Certification } from "@/domain/career/entities/Certification";

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface CertificationDTO {
  id: string;
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills: string[];
  isExpired: boolean;
}

export function toCertificationDTO(certification: Certification): CertificationDTO {
  return {
    id: certification.id,
    name: certification.name,
    issuer: certification.issuer,
    issueDate: certification.issueDate?.toISOString(),
    expiryDate: certification.expiryDate?.toISOString(),
    credentialId: certification.credentialId,
    credentialUrl: certification.credentialUrl,
    skills: [...certification.skills],
    isExpired: certification.isExpired,
  };
}
