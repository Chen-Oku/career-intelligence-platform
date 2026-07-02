import { buildCandidateSection, CandidateProfileContext } from "./job.prompts";
import { ABOUT_ME_EXAMPLE, ELEVATOR_PITCH_EXAMPLE, STRENGTHS_EXAMPLE } from "./examples/profile.examples";
import { RESPONSE_QUALITY_BAR } from "./shared.prompts";

/**
 * Profile Prompts — generates "About Me" and "Elevator Pitch" text
 * grounded in the same candidate profile data used by the job analyzer
 * and interview coach, so all three stay consistent with each other.
 */

/**
 * A voice guide is the candidate's own style preferences (tone words,
 * phrases to avoid/prefer) — authored by them, not generated. When present
 * it overrides the system prompt's own generic tone guidance, so the
 * output sounds like this specific person rather than "a competent
 * professional" in general.
 */
export function buildVoiceGuideSection(voiceGuide?: string | null): string {
  if (!voiceGuide || !voiceGuide.trim()) return "";
  return `\n\n## THIS CANDIDATE'S VOICE GUIDE — follow this over any generic tone guidance above\n${voiceGuide.trim()}`;
}

export function buildProfileSystemPrompt(voiceGuide?: string | null): string {
  return `You are a senior personal-branding coach and career strategist. You help candidates describe themselves in a way that is specific, confident, and grounded in their real experience — never generic, never clichéd.

GROUNDING RULE — strictly enforced: You write exclusively from the candidate data provided in the prompt. You MUST NOT invent facts, companies, job titles, technologies, years of experience, certifications, achievements, or any detail absent from the input. When the profile is sparse, write less — never fabricate to compensate. Every claim must be directly traceable to the input data.

## EXAMPLES OF IDEAL OUTPUT

Study these before writing. Match the specificity, tone, and rhythm — then apply it to the actual candidate data you receive.

### Ideal About Me:
${ABOUT_ME_EXAMPLE}

### Ideal Elevator Pitch:
${ELEVATOR_PITCH_EXAMPLE}

### Ideal Strengths summary:
${STRENGTHS_EXAMPLE}
${RESPONSE_QUALITY_BAR}${buildVoiceGuideSection(voiceGuide)}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;
}

export interface GuidedAnswer {
  question: string;
  answer: string;
}

/**
 * Guided answers are the candidate's own words, typed in response to a
 * prompt like "what first drew you to this field?" — they're as grounded
 * as the profile data itself, not an invented detail, so the model may
 * draw on them directly.
 */
function buildGuidedContextSection(guidedAnswers?: GuidedAnswer[]): string {
  if (!guidedAnswers || guidedAnswers.length === 0) return "";
  const lines = guidedAnswers.map((qa) => `- ${qa.question}\n  ${qa.answer}`).join("\n");
  return `\n\n# ADDITIONAL CONTEXT FROM THE CANDIDATE (their own words — treat as grounded fact, use directly)\n${lines}`;
}

export function buildAboutMePrompt(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";
  const hasGuidance = !!guidedAnswers && guidedAnswers.length > 0;

  const lengthInstruction = hasGuidance
    ? "Write a first-person professional \"About Me\" bio, 4-6 short paragraphs, in a natural, reflective narrative voice — weave in the additional context below (their path into the field, how they work, what they're curious about, what they're looking for) alongside the profile facts."
    : "Write a first-person professional \"About Me\" bio, 2-3 short paragraphs (roughly 6-10 sentences total — match the depth of the example above, not a shorter summary of it), covering: their professional identity and how they got here, the range of their experience (if they've worked across more than one discipline or domain, connect the dots between them), and what they're aiming for next. If the profile has enough material (multiple experiences, a broad skill set, stories), use it — don't compress a rich profile into a thin summary.";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
${lengthInstruction} Use ONLY facts from the candidate profile and the additional context above — pull real company names, technologies, and achievements. Never invent education, certifications, years of experience, or anything not shown above.
Natural and confident, no clichés ("passionate team player," "results-driven professional," "self-starter").
All text in ${lang}.

Return ONLY this JSON:
{ "aboutMe": "string" }`;
}

export function buildElevatorPitchPrompt(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write a spoken elevator pitch — 30-60 seconds when read aloud (roughly 75-150 words, and use the full range if the profile has enough material — don't undersell a rich profile with a short pitch) — structured as: who they are → their standout strength or achievement, with a real number or outcome if the profile has one → what they're looking for next. Use ONLY facts from the candidate profile and the additional context above — never invent a detail that isn't there.
Punchy and conversational, sounds natural when spoken out loud, not like a written paragraph. No stock phrases ("I'm a passionate...", "I bring to the table...").
All text in ${lang}.

Return ONLY this JSON:
{ "elevatorPitch": "string" }`;
}

export function buildStrengthsPrompt(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[]): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}${buildGuidedContextSection(guidedAnswers)}

# TASK
Write a first-person "Strengths" summary, 3-4 short paragraphs, that synthesizes this candidate's most distinctive strengths — patterns across their skills, experience, and stories that a single job title wouldn't show on its own. Look specifically for: cross-disciplinary range (skills or experience spanning more than one field or category), a recurring collaboration or leadership style visible across their stories (e.g. mentoring, support-oriented leadership, systems thinking, how they help a stuck teammate), and any analytical or creative pattern that repeats across different roles. Use ONLY facts, skills, and stories from the candidate profile and the additional context above — never invent a strength that isn't evidenced there. If the profile is sparse, name fewer strengths rather than padding with generic ones.
Natural and confident, no clichés ("team player," "results-driven," "hard worker").
All text in ${lang}.

Return ONLY this JSON:
{ "strengths": "string" }`;
}

/**
 * Profile Feedback Prompts — coaching feedback on a hand-written About Me /
 * Elevator Pitch draft. Deliberately separate from the interview-coach rubric:
 * a bio isn't an interview answer, so it shouldn't be judged for STAR structure
 * (setup/action/result). It's judged as a piece of personal-branding writing.
 */

export function buildProfileFeedbackSystemPrompt(voiceGuide?: string | null): string {
  return `You are a senior personal-branding coach. You give direct, specific, encouraging-but-honest feedback on a candidate's own "About Me" bio or elevator pitch draft.

Rules:
- Judge it as a piece of personal-branding writing, NOT as an interview answer — do not penalize it for lacking a setup/action/result structure. A bio can be narrative, reflective, or list real strengths and interests; that is valid structure for this format.
- Judge on: (1) voice — does it sound like a real, specific person rather than a generic template; (2) grounding — does it draw on real details from their profile (companies, tools, projects, traits) rather than vague filler; (3) clarity of who they are and what they're looking for; (4) whether it avoids AI-cliché phrasing.
- Never invent a fact, number, or detail that isn't in the candidate's draft or their real profile data below. If the draft is vague, say so and point to a real detail from their profile they could add — don't make one up.
- If the draft already uses a real detail well, or has a distinctive voice, say so — this is coaching, not just criticism.
${RESPONSE_QUALITY_BAR}${buildVoiceGuideSection(voiceGuide)}${voiceGuide?.trim() ? "\nIf the draft violates the voice guide above (e.g. uses a word it says to avoid), call that out as an improvement." : ""}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;
}

const FEEDBACK_TASK_LABEL: Record<"aboutMe" | "elevatorPitch" | "strengths", string> = {
  aboutMe: "a professional \"About Me\" bio",
  elevatorPitch: "a 30-60 second spoken elevator pitch",
  strengths: "a first-person summary of the candidate's key professional strengths",
};

export function buildProfileFeedbackPrompt(
  field: "aboutMe" | "elevatorPitch" | "strengths",
  draftText: string,
  profile: CandidateProfileContext,
  language: string,
): string {
  const lang = language === "es" ? "Spanish" : "English";

  return `${buildCandidateSection(profile)}

# DRAFT TO REVIEW
This is the candidate's own draft of ${FEEDBACK_TASK_LABEL[field]}:

${draftText}

# FEEDBACK INSTRUCTIONS

1. **score**: 0-100 rating of this draft as personal-branding writing (voice, grounding in real details, clarity, absence of clichés) — not a judgment of their career, and not graded against interview-answer structure.
2. **strengths**: 2-4 specific things the draft does well. Quote or reference the actual text.
3. **improvements**: 2-4 specific, actionable changes. When a real profile detail (a story, a number, a tool) would strengthen it, name it. Never suggest inventing a generic detail.
4. **rewrittenSuggestion**: an improved version — reorganize/sharpen what they wrote, and you may fold in real facts from their profile above. Never add a fact that isn't in their draft or their profile. If their draft is already strong, this can be a light polish rather than a rewrite. If you genuinely cannot improve on it without inventing something, set this to null.

Write "strengths", "improvements", and "rewrittenSuggestion" (if not null) in ${lang}. The draft you're reviewing may itself be in ${lang} — that's expected, not something to flag.

Return ONLY this JSON:
{
  "score": number,
  "strengths": ["string"],
  "improvements": ["string"],
  "rewrittenSuggestion": "string or null"
}`;
}
