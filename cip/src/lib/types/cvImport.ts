/**
 * RawImportResult — the structured extraction returned by Gemini for an
 * uploaded CV/resume. Loosely typed (mostly optional) because it comes from
 * free-text AI extraction — the review screen is where the user fixes
 * anything missing or wrong before it's saved as real domain records.
 */
export interface ImportedExperience {
  company: string;
  position: string;
  location?: string;
  industry?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface ImportedProject {
  name: string;
  description: string;
  technologies: string[];
  myRole?: string;
  results?: string;
}

export interface ImportedSkills {
  technical: string[];
  soft: string[];
}

export interface ImportedEducation {
  institution: string;
  degree: string;
  field?: string;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
}

export interface ImportedCertification {
  name: string;
  issuer: string;
  issueDate?: string;
  credentialId?: string;
  credentialUrl?: string;
}

export interface RawImportResult {
  experiences: ImportedExperience[];
  projects: ImportedProject[];
  skills: ImportedSkills;
  education: ImportedEducation[];
  certifications: ImportedCertification[];
}

// ─── Form value mappers ─────────────────────────────────────────────────────
// Map AI-extracted items to the same defaultValues shape the existing
// ExperienceForm/ProjectForm already accept, so the review screen can
// reuse those forms directly instead of building new ones.

export function importedExperienceToFormValues(item: ImportedExperience) {
  return {
    company: item.company,
    position: item.position,
    industry: item.industry ?? "",
    location: item.location ?? "",
    startDate: new Date(item.startDate),
    endDate: item.endDate ? new Date(item.endDate) : undefined,
    isCurrent: item.isCurrent,
    responsibilities: [...item.responsibilities],
    achievements: [...item.achievements],
    technologies: [...item.technologies],
  };
}

export function importedProjectToFormValues(item: ImportedProject) {
  return {
    name: item.name,
    description: item.description,
    technologies: [...item.technologies],
    myRole: item.myRole ?? "",
    results: item.results ?? "",
  };
}

export function importedEducationToFormValues(item: ImportedEducation) {
  return {
    institution: item.institution,
    degree: item.degree,
    field: item.field ?? "",
    startDate: item.startDate ? new Date(item.startDate) : undefined,
    endDate: item.endDate ? new Date(item.endDate) : undefined,
    isOngoing: item.isOngoing,
    skills: [],
  };
}

export function importedCertificationToFormValues(item: ImportedCertification) {
  return {
    name: item.name,
    issuer: item.issuer,
    issueDate: item.issueDate ? new Date(item.issueDate) : undefined,
    credentialId: item.credentialId ?? "",
    credentialUrl: item.credentialUrl ?? "",
    skills: [],
  };
}
