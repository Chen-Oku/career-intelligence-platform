import { geminiComplete } from "./GeminiClient";
import {
  RESUME_TYPE_PRESET_SUGGESTER_SYSTEM_PROMPT,
  buildResumeTypePresetSuggestionPrompt,
  ResumeTypePresetSuggestionContext,
} from "../prompts/resumeTypePreset.prompts";

export interface CandidateResumeTypePreset {
  name: string;
  focus: string;
  vocabulary?: string;
  prioritizeKeywords: string[];
  defaultTitle?: string;
}

export class ResumeTypePresetSuggesterService {
  async suggest(context: ResumeTypePresetSuggestionContext): Promise<CandidateResumeTypePreset[]> {
    const raw = await geminiComplete({
      system: RESUME_TYPE_PRESET_SUGGESTER_SYSTEM_PROMPT,
      prompt: buildResumeTypePresetSuggestionPrompt(context),
      maxTokens: 1024,
      temperature: 0.5,
    });

    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): CandidateResumeTypePreset[] {
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

    const suggestions = (parsed as { suggestions?: unknown }).suggestions;
    if (!Array.isArray(suggestions)) throw new Error("AI returned an invalid response. Please try again.");

    return suggestions
      .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null)
      .map((s) => ({
        name: typeof s.name === "string" ? s.name.trim() : "",
        focus: typeof s.focus === "string" ? s.focus.trim() : "",
        vocabulary: typeof s.vocabulary === "string" ? s.vocabulary.trim() : undefined,
        prioritizeKeywords: Array.isArray(s.prioritizeKeywords)
          ? s.prioritizeKeywords.filter((k): k is string => typeof k === "string")
          : [],
        defaultTitle: typeof s.defaultTitle === "string" ? s.defaultTitle.trim() : undefined,
      }))
      .filter((s) => s.name.length > 0 && s.focus.length > 0)
      .slice(0, 4);
  }
}
