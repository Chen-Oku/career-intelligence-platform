import type { CandidateProfileContext } from "./job.prompts";

/**
 * Resume Type Preset Suggestion Prompt
 *
 * Proposes a handful of candidate "resume type presets" (name + focus +
 * vocabulary + priority keywords + default title) from the user's real
 * career data — reviewed and selectively added by the user, never applied
 * automatically. Mirrors targetRole.prompts.ts's shape/tone.
 */

export const RESUME_TYPE_PRESET_SUGGESTER_SYSTEM_PROMPT = `You are an expert resume writer and career coach. Given a candidate's real career data (experience, projects, skills, stories), propose distinct "resume type" presets — reusable specializations/angles a candidate can generate a tailored resume from (e.g. "Backend Engineer", "ArchViz Artist", "Product Designer").

GROUNDING RULE — strictly enforced: only propose specializations genuinely evidenced by the candidate's real data. Never invent an industry, domain, or seniority level the data doesn't support. If the candidate's data only supports one clear specialization, propose fewer presets rather than padding with unsupported ones.

You MUST respond with ONLY valid JSON. No markdown code blocks, no explanation. Start your response with { and end with }.`;

export interface ResumeTypePresetSuggestionContext extends CandidateProfileContext {
  language: string;
  /** Presets the user already has — avoid proposing near-duplicates. */
  existingPresetNames: string[];
}

export function buildResumeTypePresetSuggestionPrompt(ctx: ResumeTypePresetSuggestionContext): string {
  const list = (items: string[]) => (items.length ? items.join(", ") : "(none listed)");

  const skillsSection = ctx.userSkills
    .map((g) => `${g.category}: ${g.skills.map((s) => s.name).join(", ")}`)
    .join("\n");

  const experienceSection = ctx.userExperience
    .map((e) => `${e.position} @ ${e.company} (${e.durationLabel}) — technologies: ${list(e.technologies)}`)
    .join("\n");

  const projectsSection = ctx.userProjects
    .map((p) => `${p.name}: ${p.description} — technologies: ${list(p.technologies)}`)
    .join("\n");

  return `# CANDIDATE CAREER DATA

## Experience
${experienceSection || "(none)"}

## Projects
${projectsSection || "(none)"}

## Skills
${skillsSection || "(none)"}

## Presets the candidate already has (don't propose near-duplicates)
${list(ctx.existingPresetNames)}

# TASK
Propose up to 4 distinct resume type presets for this candidate, each genuinely supported by the data above. For each, provide:
- "name": short label (under 40 characters), written in ${ctx.language === "es" ? "Spanish" : "English"}
- "focus": 1-2 sentences on what a resume of this type should emphasize
- "vocabulary": comma-separated terms/phrasing this specialization typically uses
- "prioritizeKeywords": array of the candidate's own real skills/tools most relevant to this angle (must appear in the candidate's data above — never invent one)
- "defaultTitle": a professional title to prefill under the candidate's name for this angle (under 60 characters)

Return ONLY this JSON structure:
{ "suggestions": [ { "name": "...", "focus": "...", "vocabulary": "...", "prioritizeKeywords": ["..."], "defaultTitle": "..." } ] }`;
}
