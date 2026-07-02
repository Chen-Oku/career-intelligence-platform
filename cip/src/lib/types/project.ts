import { Project } from "@/domain/career/entities/Project";

export interface ProjectDTO {
  id: string;
  name: string;
  description: string;
  goal?: string;
  technologies: string[];
  teamSize?: number;
  myRole?: string;
  challenges?: string;
  results?: string;
  lessonsLearned?: string;
  startDate?: string;
  endDate?: string;
  isHighlighted: boolean;
  isPublic: boolean;
  tags: string[];
  externalUrl?: string;
  githubUrl?: string;
  order: number;
}

export function toProjectDTO(project: Project): ProjectDTO {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    goal: project.goal,
    technologies: [...project.technologies],
    teamSize: project.teamSize,
    myRole: project.myRole,
    challenges: project.challenges,
    results: project.results,
    lessonsLearned: project.lessonsLearned,
    startDate: project.startDate?.toISOString(),
    endDate: project.endDate?.toISOString(),
    isHighlighted: project.isHighlighted,
    isPublic: project.isPublic,
    tags: [...project.tags],
    externalUrl: project.externalUrl,
    githubUrl: project.githubUrl,
    order: project.order,
  };
}

/** Converts a DTO back to form-compatible values for the edit page. */
export function projectDTOToFormValues(dto: ProjectDTO) {
  return {
    name: dto.name,
    description: dto.description,
    goal: dto.goal ?? "",
    technologies: [...dto.technologies],
    teamSize: dto.teamSize,
    myRole: dto.myRole ?? "",
    challenges: dto.challenges ?? "",
    results: dto.results ?? "",
    lessonsLearned: dto.lessonsLearned ?? "",
    startDate: dto.startDate ? new Date(dto.startDate) : undefined,
    endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    isHighlighted: dto.isHighlighted,
    isPublic: dto.isPublic,
    tags: [...dto.tags],
    externalUrl: dto.externalUrl ?? "",
    githubUrl: dto.githubUrl ?? "",
    order: dto.order,
  };
}
