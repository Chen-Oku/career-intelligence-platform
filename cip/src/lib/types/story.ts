import { Story, StoryCategory } from "@/domain/career/entities/Story";

// ─── DTO ─────────────────────────────────────────────────────────────────────

export interface StoryDTO {
  id: string;
  title: string;
  category: StoryCategory;
  situation: string;
  task: string;
  action: string;
  result: string;
  impact?: string;
  skills: string[];
  keywords: string[];
  createdAt?: string;
}

export function toStoryDTO(story: Story): StoryDTO {
  return {
    id: story.id,
    title: story.title,
    category: story.category,
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    impact: story.impact,
    skills: [...story.skills],
    keywords: [...story.keywords],
  };
}

export function storyDTOToFormValues(dto: StoryDTO) {
  return {
    title: dto.title,
    category: dto.category,
    situation: dto.situation,
    task: dto.task,
    action: dto.action,
    result: dto.result,
    impact: dto.impact ?? "",
    skills: [...dto.skills],
    keywords: [...dto.keywords],
  };
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const STORY_CATEGORY_LABELS: Record<StoryCategory, string> = {
  LEADERSHIP:         "Leadership",
  CONFLICT:           "Conflict Resolution",
  INNOVATION:         "Innovation",
  FAILURE:            "Overcoming Failure",
  PROBLEM_SOLVING:    "Problem Solving",
  COMMUNICATION:      "Communication",
  ADAPTABILITY:       "Adaptability",
  LEARNING:           "Learning",
  MENTORING:          "Mentoring",
  CUSTOMER_SUCCESS:   "Client Success",
  PROJECT_MANAGEMENT: "Project Management",
};

/** Tailwind color classes per category — distinct but not loud */
export const STORY_CATEGORY_COLORS: Record<StoryCategory, string> = {
  LEADERSHIP:         "bg-purple-50 text-purple-700 border-purple-200",
  CONFLICT:           "bg-rose-50 text-rose-700 border-rose-200",
  INNOVATION:         "bg-cyan-50 text-cyan-700 border-cyan-200",
  FAILURE:            "bg-orange-50 text-orange-700 border-orange-200",
  PROBLEM_SOLVING:    "bg-blue-50 text-blue-700 border-blue-200",
  COMMUNICATION:      "bg-green-50 text-green-700 border-green-200",
  ADAPTABILITY:       "bg-teal-50 text-teal-700 border-teal-200",
  LEARNING:           "bg-indigo-50 text-indigo-700 border-indigo-200",
  MENTORING:          "bg-pink-50 text-pink-700 border-pink-200",
  CUSTOMER_SUCCESS:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  PROJECT_MANAGEMENT: "bg-amber-50 text-amber-700 border-amber-200",
};
