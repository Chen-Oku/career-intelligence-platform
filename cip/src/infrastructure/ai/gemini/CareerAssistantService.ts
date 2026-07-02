import { geminiComplete } from "./GeminiClient";
import {
  ASSISTANT_SYSTEM_PROMPT,
  buildAssistantPrompt,
  AssistantPromptContext,
} from "../prompts/assistant.prompts";
import {
  ASSISTANT_SECTIONS,
  type AssistantAction,
  type AssistantChatResult,
  type AssistantSection,
  type AssistantSuggestion,
} from "@/lib/types/assistant";

/**
 * CareerAssistantService — conversational assistant that also extracts
 * structured, section-classified suggestions from free text.
 *
 * Mirrors CVImportService/JobAnalyzerService: call the model, defensively
 * parse its JSON, normalize the parts the model tends to get loose with.
 */
export class CareerAssistantService {
  async chat(context: AssistantPromptContext): Promise<AssistantChatResult> {
    const raw = await geminiComplete({
      system: ASSISTANT_SYSTEM_PROMPT,
      prompt: buildAssistantPrompt(context),
      // A long pasted text can yield several full suggestions (a STAR story
      // alone is 4 paragraphs of payload) on top of the reply.
      maxTokens: 6144,
      temperature: 0.4,
    });

    return this.parseResponse(raw);
  }

  private parseResponse(raw: string): AssistantChatResult {
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
      if (!match) {
        // The model answered in prose despite instructions. Rather than
        // failing the whole turn, degrade gracefully: use the prose as the
        // reply and skip suggestions.
        if (clean.length > 0) return { reply: clean, suggestions: [] };
        console.error("[CareerAssistantService] empty/unparseable response");
        throw new Error("AI returned an invalid response format. Please try again.");
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        console.error("[CareerAssistantService] unparseable response (likely truncated):", clean.slice(-500));
        throw new Error("AI returned an invalid response format. Please try again.");
      }
    }

    const content = parsed as Record<string, unknown>;
    const reply = typeof content.reply === "string" ? content.reply.trim() : "";
    const suggestions = this.sanitizeSuggestions(content.suggestions);

    if (!reply && suggestions.length === 0) {
      console.error("[CareerAssistantService] response had neither reply nor suggestions:", content);
      throw new Error("AI response was missing required fields. Please try again.");
    }

    return { reply, suggestions };
  }

  /**
   * The model's JSON isn't a type-checked boundary: sections come back in
   * the wrong case, `data` is sometimes missing, skill levels get invented
   * for soft skills. Normalize here so the client can trust the shape;
   * field-level validity is checked client-side with the shared Zod create
   * schemas before a suggestion can be applied.
   */
  private sanitizeSuggestions(value: unknown): AssistantSuggestion[] {
    if (!Array.isArray(value)) return [];

    const result: AssistantSuggestion[] = [];
    for (const item of value) {
      if (typeof item !== "object" || item === null) continue;
      const s = item as Record<string, unknown>;

      const section = typeof s.section === "string" ? (s.section.toUpperCase() as AssistantSection) : null;
      if (!section || !ASSISTANT_SECTIONS.includes(section)) continue;

      const data = typeof s.data === "object" && s.data !== null && !Array.isArray(s.data)
        ? ({ ...(s.data as Record<string, unknown>) })
        : null;
      if (!data) continue;

      // Action: default CREATE; UPDATE only counts with a targetId to patch,
      // and never for skills (create-only by design).
      let action: AssistantAction =
        typeof s.action === "string" && s.action.toUpperCase() === "UPDATE" ? "UPDATE" : "CREATE";
      const targetId = typeof s.targetId === "string" && s.targetId.trim() ? s.targetId.trim() : undefined;
      if (action === "UPDATE" && (!targetId || section === "SKILL")) action = "CREATE";

      if (section === "SKILL") this.normalizeSkillData(data);

      const title =
        typeof s.title === "string" && s.title.trim()
          ? s.title.trim()
          : typeof data.name === "string" && data.name
            ? (data.name as string)
            : typeof data.title === "string" && data.title
              ? (data.title as string)
              : section;

      result.push({
        section,
        action,
        targetId: action === "UPDATE" ? targetId : undefined,
        title,
        reason: typeof s.reason === "string" ? s.reason.trim() : "",
        data,
      });
    }
    return result;
  }

  private normalizeSkillData(data: Record<string, unknown>): void {
    if (typeof data.category === "string") data.category = data.category.toUpperCase();
    if (typeof data.level === "string") data.level = data.level.toUpperCase();
    if (data.category === "SOFT") {
      // Soft skills never carry a level (createSkillSchema forbids nothing,
      // but the domain treats level as meaningless for SOFT).
      delete data.level;
    } else if (!data.level) {
      // Non-SOFT skills require a level to pass createSkillSchema. The text
      // rarely states one, so default to INTERMEDIATE — the user can adjust
      // it later in the Skills section.
      data.level = "INTERMEDIATE";
    }
  }
}
