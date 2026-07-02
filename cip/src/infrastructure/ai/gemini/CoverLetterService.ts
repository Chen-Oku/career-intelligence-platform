import { geminiComplete } from "./GeminiClient";
import { buildCoverLetterSystemPrompt, buildCoverLetterPrompt } from "../prompts/coverLetter.prompts";
import type { CandidateProfileContext } from "../prompts/job.prompts";
import type { JobAnalysisData } from "@/lib/types/job";

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

/** CoverLetterService — generates a cover letter tailored to a specific job posting. */
export class CoverLetterService {
  async generate(
    profile: CandidateProfileContext,
    company: string,
    jobTitle: string,
    jobText: string,
    language: string,
    analysis?: JobAnalysisData | null,
    extraNotes?: string,
    voiceGuide?: string | null,
  ): Promise<string> {
    const raw = await geminiComplete({
      system: buildCoverLetterSystemPrompt(voiceGuide),
      prompt: buildCoverLetterPrompt(profile, company, jobTitle, jobText, language, analysis, extraNotes),
      maxTokens: 1536,
      temperature: 0.4,
    });
    return parseField(raw, "coverLetter");
  }
}
