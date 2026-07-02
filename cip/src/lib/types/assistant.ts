/**
 * Career Assistant types — shared between the API route, the AI service,
 * and the chat widget.
 *
 * A "suggestion" is a structured entry the assistant extracted from the
 * user's free text, classified into the section it belongs to. Its `data`
 * payload targets the same create schema the section's form already uses,
 * so applying a suggestion is just a POST to the existing endpoint.
 */

export const ASSISTANT_SECTIONS = ["SKILL", "EXPERIENCE", "PROJECT", "STORY"] as const;
export type AssistantSection = (typeof ASSISTANT_SECTIONS)[number];

export const ASSISTANT_ACTIONS = ["CREATE", "UPDATE"] as const;
export type AssistantAction = (typeof ASSISTANT_ACTIONS)[number];

export interface AssistantSuggestion {
  section: AssistantSection;
  /**
   * CREATE proposes a new entry; UPDATE enriches an existing one (e.g. the
   * text adds an achievement to an experience already on file). UPDATE is
   * available for EXPERIENCE/PROJECT/STORY — skills are create-only.
   */
  action: AssistantAction;
  /** Required when action is UPDATE: id of the existing entry to patch. */
  targetId?: string;
  /** Short human-readable label for the suggestion card, e.g. the skill name. */
  title: string;
  /** Why the assistant thinks this belongs in the user's profile. */
  reason: string;
  /**
   * CREATE: payload for the section's create schema. UPDATE: only the fields
   * to change, shaped for the section's update schema — array fields must be
   * the complete new array (PATCH replaces, it doesn't append).
   */
  data: Record<string, unknown>;
}

export interface AssistantChatResult {
  reply: string;
  suggestions: AssistantSuggestion[];
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}
