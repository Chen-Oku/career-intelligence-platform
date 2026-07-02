import { geminiComplete } from "./GeminiClient";
import {
  buildProfileSystemPrompt,
  buildAboutMePrompt,
  buildElevatorPitchPrompt,
  buildStrengthsPrompt,
  buildProfileFeedbackSystemPrompt,
  buildProfileFeedbackPrompt,
  type GuidedAnswer,
} from "../prompts/profile.prompts";
import type { CandidateProfileContext } from "../prompts/job.prompts";
import type { AnswerFeedback } from "@/lib/types/interviewCoach";

const asStringArray = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v) => typeof v === "string") : []);

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

/** ProfilePitchService — generates the candidate's "About Me" bio, elevator pitch, and strengths summary. */
export class ProfilePitchService {
  async generateAboutMe(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildProfileSystemPrompt(voiceGuide),
      prompt: buildAboutMePrompt(profile, language, guidedAnswers),
      maxTokens: 1536,
      // Slightly higher than resume: the bio/pitch needs natural, flowing
      // prose, but still low enough to stay grounded in the input data.
      temperature: 0.4,
    });
    return parseField(raw, "aboutMe");
  }

  async generateElevatorPitch(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildProfileSystemPrompt(voiceGuide),
      prompt: buildElevatorPitchPrompt(profile, language, guidedAnswers),
      maxTokens: 1024,
      temperature: 0.4,
    });
    return parseField(raw, "elevatorPitch");
  }

  async generateStrengths(profile: CandidateProfileContext, language: string, guidedAnswers?: GuidedAnswer[], voiceGuide?: string | null): Promise<string> {
    const raw = await geminiComplete({
      system: buildProfileSystemPrompt(voiceGuide),
      prompt: buildStrengthsPrompt(profile, language, guidedAnswers),
      maxTokens: 1536,
      temperature: 0.4,
    });
    return parseField(raw, "strengths");
  }

  async evaluateDraft(
    field: "aboutMe" | "elevatorPitch" | "strengths",
    draftText: string,
    profile: CandidateProfileContext,
    language: string,
    voiceGuide?: string | null,
  ): Promise<AnswerFeedback> {
    const raw = await geminiComplete({
      system: buildProfileFeedbackSystemPrompt(voiceGuide),
      prompt: buildProfileFeedbackPrompt(field, draftText, profile, language),
      maxTokens: 2048,
    });
    return this.parseFeedback(raw);
  }

  private parseFeedback(raw: string): AnswerFeedback {
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
      if (!match) throw new Error("AI returned an invalid response format. Please try again.");
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        throw new Error("AI returned an invalid response format. Please try again.");
      }
    }

    const content = parsed as Record<string, unknown>;
    const score = typeof content.score === "number" ? content.score : 0;

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      strengths: asStringArray(content.strengths),
      improvements: asStringArray(content.improvements),
      rewrittenSuggestion: typeof content.rewrittenSuggestion === "string" ? content.rewrittenSuggestion : null,
    };
  }
}
