import type { CoverLetter } from "@/domain/document/entities/CoverLetter";

export interface CoverLetterDTO {
  id: string;
  company: string;
  jobTitle: string;
  content: string;
  language: string;
  jobDescriptionId?: string;
  createdAt: string;
}

export function toCoverLetterDTO(coverLetter: CoverLetter): CoverLetterDTO {
  return {
    id: coverLetter.id,
    company: coverLetter.company,
    jobTitle: coverLetter.jobTitle,
    content: coverLetter.content,
    language: coverLetter.language,
    jobDescriptionId: coverLetter.jobDescriptionId,
    createdAt: coverLetter.createdAt.toISOString(),
  };
}
