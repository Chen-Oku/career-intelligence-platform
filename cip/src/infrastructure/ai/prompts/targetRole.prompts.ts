/**
 * Target Role Suggestion Prompt
 *
 * Suggests professional title / target role labels — the short line shown
 * under the candidate's name in a resume header (e.g. "Senior 3D Artist —
 * Architectural Visualization"). Runs from the resume editor, working only
 * from the resume's own generated content — no separate job posting link
 * is stored on a Resume, so "the role I'm applying to" is inferred from
 * what the resume already says about the candidate.
 */

export const TARGET_ROLE_SUGGESTER_SYSTEM_PROMPT = `You are an expert resume writer and career coach. Given a candidate's generated resume content, suggest concise, ATS-friendly professional title / target role labels — the kind shown directly under a candidate's name in a resume header (e.g. "Senior 3D Artist — Architectural Visualization", "Gameplay Designer", "Technical Artist — Real-Time Pipelines").

GROUNDING RULE — strictly enforced: base every suggestion only on the seniority, domain, and skills evidenced in the resume data provided. Never invent a specialization, industry, or seniority level the data doesn't support.

You MUST respond with ONLY valid JSON. No markdown code blocks, no explanation. Start your response with { and end with }.`;

export interface TargetRoleSuggestionContext {
  resumeType: string;
  language: string;
  summary: string;
  mostRecentPosition?: string;
  skillCategories: string[];
  topSkills: string[];
}

export function buildTargetRoleSuggestionPrompt(ctx: TargetRoleSuggestionContext): string {
  const list = (items: string[]) => (items.length ? items.join(", ") : "(none listed)");

  return `# CANDIDATE RESUME DATA
Resume type: ${ctx.resumeType}
Most recent position: ${ctx.mostRecentPosition ?? "(not specified)"}
Professional summary: ${ctx.summary || "(none)"}
Skill categories: ${list(ctx.skillCategories)}
Top skills: ${list(ctx.topSkills)}

# TASK
Suggest exactly 3 distinct professional title / target role options for this resume header, ordered from most to least specific. Each must be:
- Under 60 characters
- Written in ${ctx.language === "es" ? "Spanish" : "English"}
- Directly supported by the data above — no invented specialization

Return ONLY this JSON structure:
{ "suggestions": ["Title option 1", "Title option 2", "Title option 3"] }`;
}
