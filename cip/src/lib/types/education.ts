import { Education } from "@/domain/career/entities/Education";

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface EducationDTO {
  id: string;
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
  skills: string[];
}

export function toEducationDTO(education: Education): EducationDTO {
  return {
    id: education.id,
    institution: education.institution,
    degree: education.degree,
    field: education.field,
    startDate: education.startDate?.toISOString(),
    endDate: education.endDate?.toISOString(),
    isOngoing: education.isOngoing,
    skills: [...education.skills],
  };
}
