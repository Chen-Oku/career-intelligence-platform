import { geminiComplete } from "./GeminiClient";
import {
  TARGET_ROLE_SUGGESTER_SYSTEM_PROMPT,
  buildTargetRoleSuggestionPrompt,
  TargetRoleSuggestionContext,
} from "../prompts/targetRole.prompts";

export class TargetRoleSuggesterService {
  async suggest(context: TargetRoleSuggestionContext): Promise<string[]> {
    const raw = await geminiComplete({
      system: TARGET_ROLE_SUGGESTER_SYSTEM_PROMPT,
      prompt: buildTargetRoleSuggestionPrompt(context),
      maxTokens: 512,
      temperature: 0.4,
    });

    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): string[] {
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
      .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
      .slice(0, 3);
  }
}
