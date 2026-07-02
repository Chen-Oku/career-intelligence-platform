import { Experience } from "@/domain/career/entities/Experience";

/**
 * ExperienceDTO — The shape that crosses the API boundary.
 *
 * Why a separate DTO?
 * Domain entities are rich objects with behavior and private state.
 * We never serialize domain entities directly. DTOs are plain objects
 * whose shape we deliberately control.
 *
 * Dates are strings here because JSON doesn't have a Date type.
 * The client is responsible for converting them back to Date objects
 * when needed (e.g. for form default values).
 */
export interface ExperienceDTO {
  id: string;
  company: string;
  position: string;
  industry?: string;
  location?: string;
  startDate: string;       // ISO 8601
  endDate?: string;        // ISO 8601
  isCurrent: boolean;
  durationLabel: string;   // "3 years 2 months" — computed, displayed as-is
  durationInMonths: number;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  skills: string[];
  hasLeadership: boolean;
  teamSize?: number;
  challenges?: string;
  starStory?: string;
  portfolioLinks: string[];
  order: number;
}

/** Maps a domain Experience entity to a plain DTO. */
export function toExperienceDTO(experience: Experience): ExperienceDTO {
  return {
    id: experience.id,
    company: experience.company,
    position: experience.position,
    industry: experience.industry,
    location: experience.location,
    startDate: experience.dateRange.startDate.toISOString(),
    endDate: experience.dateRange.endDate?.toISOString(),
    isCurrent: experience.isCurrent,
    durationLabel: experience.durationLabel,
    durationInMonths: experience.durationInMonths,
    responsibilities: [...experience.responsibilities],
    achievements: [...experience.achievements],
    technologies: [...experience.technologies],
    skills: [...experience.skills],
    hasLeadership: experience.hasLeadership,
    teamSize: experience.teamSize,
    challenges: experience.challenges,
    starStory: experience.starStory,
    portfolioLinks: [...experience.portfolioLinks],
    order: experience.order,
  };
}

/**
 * Converts a DTO back to form-compatible values.
 * Used when loading an existing experience for editing.
 * Converts ISO date strings to Date objects for the date input fields.
 */
export function dtoToFormValues(dto: ExperienceDTO) {
  return {
    company: dto.company,
    position: dto.position,
    industry: dto.industry ?? "",
    location: dto.location ?? "",
    startDate: new Date(dto.startDate),
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    isCurrent: dto.isCurrent,
    responsibilities: [...dto.responsibilities],
    achievements: [...dto.achievements],
    technologies: [...dto.technologies],
    skills: [...dto.skills],
    hasLeadership: dto.hasLeadership,
    teamSize: dto.teamSize,
    challenges: dto.challenges ?? "",
    starStory: dto.starStory ?? "",
    portfolioLinks: [...dto.portfolioLinks],
    order: dto.order,
  };
}
