import { RESPONSE_QUALITY_BAR } from "./shared.prompts";

/**
 * Job Analyzer Prompts
 *
 * Design decision: the model does extraction + recommendations.
 * Our code does match scoring.
 *
 * Why separate them?
 * Match scoring against the user's actual skill database is
 * deterministic, auditable, and doesn't waste tokens. The model
 * "guessing" a score of 72% is less accurate than us computing
 * it from fuzzy-matched skill names.
 *
 * The model's job: understand the role deeply, generate insight
 * that pure string matching cannot.
 */

/**
 * CandidateProfileContext — the candidate's real career data, independent
 * of any specific job posting. Shared with interviewCoach.prompts.ts so
 * answer evaluation grounds itself in the exact same material as the
 * original suggestedAnswer generation.
 */
export interface CandidateProfileContext {
  userSkills: { category: string; skills: { name: string; level: string }[] }[];
  userExperience: {
    company: string;
    position: string;
    durationLabel: string;
    technologies: string[];
    responsibilities: string[];
    achievements: string[];
  }[];
  userStories: {
    title: string;
    category: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    impact?: string;
    skills: string[];
  }[];
  userProjects: {
    name: string;
    description: string;
    technologies: string[];
    myRole?: string;
    results?: string;
  }[];
}

export interface JobPromptContext extends CandidateProfileContext {
  jobText: string;
  language: string;
}

export const JOB_ANALYZER_SYSTEM_PROMPT = `You are a senior technical recruiter and career strategist who has reviewed 10,000+ job descriptions. You analyze job postings with surgical precision, helping candidates understand exactly what is required and how to position themselves.

Your analysis is always:
- Specific: extract real skill names, not vague categories
- Honest: identify genuine gaps without sugar-coating
- Actionable: every insight leads to a concrete next step
- Concise: no filler, every word earns its place
${RESPONSE_QUALITY_BAR}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;

export function buildJobAnalyzerPrompt(ctx: JobPromptContext): string {
  const parts = [
    buildJobSection(ctx.jobText, ctx.language),
    buildCandidateSection(ctx),
    buildOutputSection(ctx.language),
  ];
  return parts.join("\n\n");
}

// ─── Section builders ─────────────────────────────────────────────────────────

function buildJobSection(jobText: string, language: string): string {
  // Truncate very long job descriptions to keep prompt manageable
  const truncated = jobText.length > 4000
    ? jobText.slice(0, 4000) + "\n[...truncated for analysis]"
    : jobText;

  return `# JOB DESCRIPTION
Language: ${language === "es" ? "Spanish" : "English"}

${truncated}`;
}

export function buildCandidateSection(ctx: CandidateProfileContext): string {
  const skillLines = ctx.userSkills.map(
    (g) => `${g.category}: ${g.skills.map((s) => `${s.name} (${s.level})`).join(", ")}`,
  );

  // Full bullets, not just metadata — this is the only material the model
  // is allowed to draw on when writing a suggestedAnswer, so it needs the
  // real responsibilities/achievements, not a one-line summary.
  const expBlocks = ctx.userExperience.map((e) => {
    const resp = e.responsibilities.slice(0, 6).map((r) => `  - ${r}`).join("\n");
    const ach = e.achievements.slice(0, 4).map((a) => `  + ${a}`).join("\n");
    return `• ${e.company} — ${e.position} (${e.durationLabel}) | ${e.technologies.slice(0, 6).join(", ")}\n${resp}${ach ? "\n" + ach : ""}`;
  });

  // Full STAR content — this is the primary source for grounded answers.
  const storyBlocks = ctx.userStories.map(
    (s, i) => `${i + 1}. [${s.category}] "${s.title}"
   Situation: ${s.situation}
   Task: ${s.task}
   Action: ${s.action}
   Result: ${s.result}${s.impact ? `\n   Impact: ${s.impact}` : ""}`,
  );

  const projectBlocks = ctx.userProjects.map((p) => {
    const role = p.myRole ? ` | Role: ${p.myRole}` : "";
    const results = p.results ? `\n   Results: ${p.results}` : "";
    return `• ${p.name} (${p.technologies.slice(0, 6).join(", ")})${role}\n   ${p.description}${results}`;
  });

  return `# CANDIDATE PROFILE

## Skills
${skillLines.join("\n")}

## Experience
${expBlocks.join("\n\n")}

## Projects
${projectBlocks.length > 0 ? projectBlocks.join("\n\n") : "None yet"}

## STAR Stories Available
${storyBlocks.length > 0 ? storyBlocks.join("\n\n") : "None yet"}`;
}

function buildOutputSection(language: string): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `# ANALYSIS INSTRUCTIONS

1. **extractedRole**: The exact job title from the posting
2. **extractedCompany**: Company name if mentioned, otherwise null
3. **requiredSkills**: Skills explicitly marked as required/must-have — specific tool and technology names (e.g. "3ds Max", not "3D software")
4. **niceToHaveSkills**: Skills listed as preferred/bonus/nice-to-have
5. **keywords**: Top 8-12 ATS keywords from the posting — terms that should appear in the resume
6. **responsibilities**: The 4-6 main things this role does (from the job description, not invented)
7. **yearsRequired**: Number of years of experience explicitly required, or null
8. **interviewQuestions**: 8-10 likely interview questions for this specific role. Vary them deliberately — different topics, different difficulty, different angles within each type (don't ask three variations of the same "tell me about a challenge" question). For each:
   - **type**: BEHAVIORAL/TECHNICAL/SITUATIONAL.
   - **storyHint**: if one of the candidate's STAR stories answers it well, reference it by title. Otherwise null.
   - **suggestedAnswer**: write a first-person draft answer using ONLY facts that appear in the candidate's STAR stories or experience bullets above. Pull real company names, numbers, and outcomes from that data — never invent a detail that isn't there. Make it sound like something a person would actually SAY out loud in an interview, not a written essay: open broad and conversational (the way you'd naturally start telling someone the story), then narrow into the specific situation, action, and result. Avoid stock openers like "At a certain workplace, X happened" or "In my previous role, I encountered a situation where" — start the way a real answer would start, varying the opening across questions. Keep it tight (roughly 80-150 words) — a spoken answer, not a monologue. If no story or experience genuinely supports this question, set this to null instead of fabricating something generic.
9. **resumeTips**: 4-6 SPECIFIC, actionable changes to make the resume more competitive for THIS job — not generic advice. Reference the actual requirements.
10. **hiringInsights**: 2-3 observations about what this company/team truly values, reading between the lines of the posting.
11. All text in ${lang}.

Return ONLY this JSON:
{
  "extractedRole": "string",
  "extractedCompany": "string or null",
  "requiredSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "keywords": ["string"],
  "responsibilities": ["string"],
  "yearsRequired": number_or_null,
  "interviewQuestions": [
    { "question": "string", "type": "BEHAVIORAL|TECHNICAL|SITUATIONAL", "storyHint": "string or null", "suggestedAnswer": "string or null" }
  ],
  "resumeTips": ["string"],
  "hiringInsights": ["string"]
}`;
}

// ─── Regenerate a single answer ────────────────────────────────────────────────

export interface RegenerateAnswerContext extends CandidateProfileContext {
  question: string;
  previousAnswer: string;
  language: string;
}

/**
 * buildRegenerateAnswerPrompt — asks for a DIFFERENT draft answer to a
 * question that already has a suggestedAnswer, so the candidate can pick
 * the angle/story that fits them best instead of being stuck with the
 * first draft. Same anti-fabrication and spoken-delivery rules apply.
 */
export function buildRegenerateAnswerPrompt(ctx: RegenerateAnswerContext): string {
  const lang = ctx.language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(ctx)}

# INTERVIEW QUESTION
${ctx.question}

# PREVIOUS SUGGESTED ANSWER (already shown to the candidate)
${ctx.previousAnswer || "(none — nothing matched before)"}

# REGENERATION INSTRUCTIONS
Write a DIFFERENT first-person draft answer to the same question above — same anti-fabrication rules as before: ONLY facts from the candidate profile, real company names/numbers/outcomes, never invented.
This must take a noticeably different angle than the previous answer: a different story/experience if one is available, a different structural opening, or a different emphasis (e.g. if the previous answer led with the outcome, lead with the context instead). Same natural-spoken-delivery rules: open broad and conversational, narrow into specifics, avoid stock phrases, roughly 80-150 words.
If nothing in the profile supports this question, return null — do not fabricate just to be different.
All text in ${lang}.

Return ONLY this JSON:
{ "suggestedAnswer": "string or null" }`;
}
