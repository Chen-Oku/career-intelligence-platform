import { buildCandidateSection, CandidateProfileContext } from "./job.prompts";
import { RESPONSE_QUALITY_BAR } from "./shared.prompts";
import { buildVoiceGuideSection } from "./profile.prompts";

/**
 * Interview Prep Prompts — a generic interview-answer toolkit, independent
 * of any specific job posting or Job Analysis (unlike suggestedAnswer in
 * job.prompts.ts, which is tailored to one posting's questions). These are
 * the answers candidates prepare once and reuse across interviews: "tell me
 * about yourself", weakness, salary expectations, and story-based behavioral
 * answers (leadership / conflict / teamwork) drawn from the Story Bank.
 */

export type StoryBasedPrepType = "leadershipStory" | "conflictStory" | "teamworkStory";
export type InterviewPrepType = "tellMeAboutYourself" | "weakness" | "salaryExpectations" | StoryBasedPrepType;

export interface GuidedAnswer {
  question: string;
  answer: string;
}

function buildGuidedContextSection(guidedAnswers?: GuidedAnswer[]): string {
  if (!guidedAnswers || guidedAnswers.length === 0) return "";
  const lines = guidedAnswers.map((qa) => `- ${qa.question}\n  ${qa.answer}`).join("\n");
  return `\n\n# ADDITIONAL CONTEXT FROM THE CANDIDATE (their own words — treat as grounded fact, use directly)\n${lines}`;
}

export function buildInterviewPrepSystemPrompt(voiceGuide?: string | null): string {
  return `You are an experienced interview coach helping a candidate prepare answers they'll reuse across interviews — not tailored to one specific job, but general-purpose and ready to adapt on the spot.

GROUNDING RULE — strictly enforced: Use only facts from the candidate profile (and any additional context they've given you) in the prompt. You MUST NOT invent employers, technologies, achievements, or any detail absent from the input. Never fabricate a story, a weakness, or a salary figure the candidate hasn't actually provided.

Write in first person, spoken and natural — this is meant to be said out loud in an interview, not read as a formal document. No stock phrases ("I'm a passionate...", "I'm a team player who...", "I bring to the table...").
${RESPONSE_QUALITY_BAR}${buildVoiceGuideSection(voiceGuide)}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;
}

export function buildTellMeAboutYourselfPrompt(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write a spoken answer to "Tell me about yourself" — 2-3 minutes when read aloud, conversational, following a clear narrative: how the candidate got into this field, the throughline connecting their different experiences, and what they're looking for next. Should feel like a real person talking, not a memorized script. Use ONLY facts from the candidate profile and additional context above.
All text in ${lang}.

Return ONLY this JSON:
{ "answer": "string" }`;
}

export function buildWeaknessPrompt(profile: CandidateProfileContext, language: string, guidedAnswers: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write a spoken answer to "What is your biggest weakness?" using the real weakness the candidate named in the additional context above. The answer must:
- Be a genuine, credible weakness — not a disguised strength ("I work too hard")
- Explain concretely how they're actively improving it, using real detail from their profile if relevant
- Not disqualify them for the kind of roles their profile shows they're suited for
Never invent a weakness they didn't name themselves.
All text in ${lang}.

Return ONLY this JSON:
{ "answer": "string" }`;
}

export function buildSalaryPrompt(profile: CandidateProfileContext, language: string, guidedAnswers: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write spoken talking points for discussing salary expectations in an interview, using the range/research the candidate provided in the additional context above. Structure: state a range confidently (not a single fixed number unless they gave one), briefly justify it by connecting to their real experience/skills, and stay open to discussing total compensation. Never invent a number they didn't provide.
All text in ${lang}.

Return ONLY this JSON:
{ "answer": "string" }`;
}

const STORY_TASK_LABEL: Record<StoryBasedPrepType, string> = {
  leadershipStory: "a time you led a team or took ownership of a situation",
  conflictStory: "a conflict with a coworker or disagreement you had to resolve",
  teamworkStory: "a time you worked effectively as part of a team",
};

export function buildStoryBasedPrompt(
  type: StoryBasedPrepType,
  profile: CandidateProfileContext,
  language: string,
  guidedAnswers?: GuidedAnswer[],
): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write a spoken answer to "Tell me about ${STORY_TASK_LABEL[type]}" using the STAR structure (Situation, Task, Action, Result) but delivered as natural spoken narrative, not labeled sections. Pick the real story from the candidate's Story Bank above that best fits this question. Use ONLY facts from that story and the candidate profile — never invent details, dialogue, or outcomes not in the source story.
All text in ${lang}.

Return ONLY this JSON:
{ "answer": "string" }`;
}
