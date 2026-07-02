import type { CandidateProfileContext } from "./prompts/job.prompts";
import type { Skill } from "@/domain/career/entities/Skill";
import type { Experience } from "@/domain/career/entities/Experience";
import type { Story } from "@/domain/career/entities/Story";
import type { Project } from "@/domain/career/entities/Project";
import { CATEGORY_LABELS } from "@/lib/types/skill";

/**
 * Builds the candidate's real-data profile context from domain entities.
 * Shared by JobAnalyzerService (suggestedAnswer generation) and
 * InterviewCoachService (answer evaluation) — both need the exact same
 * grounding material so neither one can drift from what's actually real.
 */
export function buildCandidateProfileContext(
  skills: Skill[],
  experiences: Experience[],
  stories: Story[],
  projects: Project[],
): CandidateProfileContext {
  return {
    userSkills: formatSkills(skills),
    userExperience: experiences.slice(0, 6).map((e) => ({
      company: e.company,
      position: e.position,
      durationLabel: e.durationLabel,
      technologies: [...e.technologies],
      responsibilities: [...e.responsibilities],
      achievements: [...e.achievements],
    })),
    userStories: stories.map((s) => ({
      title: s.title,
      category: s.category,
      situation: s.situation,
      task: s.task,
      action: s.action,
      result: s.result,
      impact: s.impact,
      skills: [...s.skills],
    })),
    userProjects: projects.slice(0, 6).map((p) => ({
      name: p.name,
      description: p.description,
      technologies: [...p.technologies],
      myRole: p.myRole,
      results: p.results,
    })),
  };
}

function formatSkills(skills: Skill[]): CandidateProfileContext["userSkills"] {
  const map = new Map<string, { name: string; level: string }[]>();
  for (const skill of skills) {
    const label = CATEGORY_LABELS[skill.category] ?? skill.category;
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push({ name: skill.name, level: skill.level ?? "N/A" });
  }
  return Array.from(map.entries()).map(([category, skills]) => ({ category, skills }));
}
