import { geminiComplete } from "./GeminiClient";
import {
  buildInterviewPrepSystemPrompt,
  buildTellMeAboutYourselfPrompt,
  buildWeaknessPrompt,
  buildSalaryPrompt,
  buildStoryBasedPrompt,
  type StoryBasedPrepType,
  type GuidedAnswer,
} from "../prompts/interviewPrep.prompts";
import type { CandidateProfileContext } from "../prompts/job.prompts";

function parseField(raw: string, field: string): string {
  const clean = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned an invalid response. Please try again.");
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("AI returned an invalid response. Please try again.");
    }
  }

  const content = parsed as Record<string, unknown>;
  if (typeof content[field] !== "string") {
    throw new Error("AI response was missing required fields. Please try again.");
  }
  return content[field];
}

/** InterviewPrepService — generates general-purpose interview answers, independent of any specific job posting. */
export class InterviewPrepService {
  async generateTellMeAboutYourself(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildInterviewPrepSystemPrompt(voiceGuide),
      prompt: buildTellMeAboutYourselfPrompt(profile, language, guidedAnswers),
      maxTokens: 1024,
      temperature: 0.4,
    });
    return parseField(raw, "answer");
  }

  async generateWeakness(profile: CandidateProfileContext, language: string, guidedAnswers: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildInterviewPrepSystemPrompt(voiceGuide),
      prompt: buildWeaknessPrompt(profile, language, guidedAnswers),
      maxTokens: 768,
      temperature: 0.4,
    });
    return parseField(raw, "answer");
  }

  async generateSalaryExpectations(profile: CandidateProfileContext, language: string, guidedAnswers: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildInterviewPrepSystemPrompt(voiceGuide),
      prompt: buildSalaryPrompt(profile, language, guidedAnswers),
      maxTokens: 768,
      temperature: 0.4,
    });
    return parseField(raw, "answer");
  }

  async generateStoryBasedAnswer(
    type: StoryBasedPrepType,
    profile: CandidateProfileContext,
    language: string,
    guidedAnswers?: GuidedAnswer[],
    voiceGuide?: string | null,
  ): Promise<string> {
    const raw = await geminiComplete({
      system: buildInterviewPrepSystemPrompt(voiceGuide),
      prompt: buildStoryBasedPrompt(type, profile, language, guidedAnswers),
      maxTokens: 1024,
      temperature: 0.4,
    });
    return parseField(raw, "answer");
  }
}
