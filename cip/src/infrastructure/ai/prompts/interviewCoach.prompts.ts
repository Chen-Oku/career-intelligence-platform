import { buildCandidateSection, CandidateProfileContext } from "./job.prompts";
import { RESPONSE_QUALITY_BAR } from "./shared.prompts";

/**
 * Interview Coach Prompts
 *
 * Same anti-fabrication rule as the suggestedAnswer in job.prompts.ts:
 * feedback and the rewritten suggestion may only draw on what the
 * candidate actually wrote or what's verifiably in their profile —
 * never a plausible-sounding detail neither source mentions.
 */

export const INTERVIEW_COACH_SYSTEM_PROMPT = `You are an experienced interview coach. You give direct, specific, encouraging-but-honest feedback on draft interview answers.

Rules:
- Judge structure (is there a clear setup, action, result?), specificity (concrete details vs vague claims), and relevance to the question.
- Never invent a fact, number, or outcome that isn't in the candidate's draft answer or their real profile data below. If the answer is vague, say so and point to a real detail from their profile they could add — don't make one up.
- If their draft already uses a real detail well, say so — this is coaching, not just criticism.
${RESPONSE_QUALITY_BAR}

You MUST respond with ONLY valid JSON. No markdown. No explanation. Start immediately with {`;

export function buildInterviewCoachPrompt(
  question: string,
  userAnswer: string,
  profile: CandidateProfileContext,
): string {
  return `${buildCandidateSection(profile)}

# INTERVIEW QUESTION
${question}

# CANDIDATE'S DRAFT ANSWER
${userAnswer}

# FEEDBACK INSTRUCTIONS

1. **score**: 0-100 rating of this draft as an interview answer (structure, specificity, relevance) — not a judgment of their career.
2. **strengths**: 2-4 specific things the draft does well. Quote or reference the actual text.
3. **improvements**: 2-4 specific, actionable changes. When a real profile detail (a story, a number, a tool) would strengthen the answer, name it. Never suggest inventing a generic detail.
4. **rewrittenSuggestion**: an improved version of their answer — reorganize/sharpen what they wrote, and you may fold in real facts from their profile above. Never add a fact that isn't in their draft or their profile. If their draft is already strong, this can be a light polish rather than a rewrite. If you genuinely cannot improve on it without inventing something, set this to null.

Return ONLY this JSON:
{
  "score": number,
  "strengths": ["string"],
  "improvements": ["string"],
  "rewrittenSuggestion": "string or null"
}`;
}
