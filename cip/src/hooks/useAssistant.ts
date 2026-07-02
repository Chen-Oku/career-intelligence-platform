import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ZodSchema } from "zod";
import type {
  AssistantChatResult,
  AssistantMessage,
  AssistantSection,
  AssistantSuggestion,
} from "@/lib/types/assistant";
import { createSkillSchema } from "@/lib/validators/skill.schema";
import { createExperienceSchema, updateExperienceSchema } from "@/lib/validators/experience.schema";
import { createProjectSchema, updateProjectSchema } from "@/lib/validators/project.schema";
import { createStorySchema, updateStorySchema } from "@/lib/validators/story.schema";
import { skillKeys } from "@/hooks/useSkills";
import { experienceKeys } from "@/hooks/useExperiences";
import { projectKeys } from "@/hooks/useProjects";
import { storyKeys } from "@/hooks/useStories";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  const { data } = await res.json();
  return data as T;
}

/**
 * Everything needed to route a suggestion to its section: which endpoint
 * creates/patches it, which query cache to invalidate, and which shared Zod
 * schema decides whether the extracted data is complete enough to apply.
 * Reusing the section schemas keeps the assistant honest — it can't sneak a
 * payload past validation that the section's own form would reject.
 *
 * Skills have no updateSchema on purpose: the assistant is create-only for
 * skills (an UPDATE suggestion for SKILL is downgraded server-side anyway).
 */
const SECTION_CONFIG: Record<
  AssistantSection,
  { endpoint: string; queryKey: readonly string[]; createSchema: ZodSchema; updateSchema?: ZodSchema }
> = {
  SKILL: {
    endpoint: "/api/skills",
    queryKey: skillKeys.all,
    createSchema: createSkillSchema,
  },
  EXPERIENCE: {
    endpoint: "/api/experience",
    queryKey: experienceKeys.all,
    createSchema: createExperienceSchema,
    updateSchema: updateExperienceSchema,
  },
  PROJECT: {
    endpoint: "/api/projects",
    queryKey: projectKeys.all,
    createSchema: createProjectSchema,
    updateSchema: updateProjectSchema,
  },
  STORY: {
    endpoint: "/api/stories",
    queryKey: storyKeys.all,
    createSchema: createStorySchema,
    updateSchema: updateStorySchema,
  },
};

/**
 * Validates the suggestion against its target schema. The update schemas
 * require `id`, which lives in `targetId` (the PATCH routes re-inject it
 * from the URL) — merge it in for validation only.
 */
function parseSuggestion(suggestion: AssistantSuggestion) {
  const config = SECTION_CONFIG[suggestion.section];
  if (suggestion.action === "UPDATE") {
    if (!config.updateSchema || !suggestion.targetId) return null;
    const parsed = config.updateSchema.safeParse({ ...suggestion.data, id: suggestion.targetId });
    return parsed.success ? parsed.data : null;
  }
  const parsed = config.createSchema.safeParse(suggestion.data);
  return parsed.success ? parsed.data : null;
}

/** True when the suggestion's data passes its section + action schema. */
export function isSuggestionApplicable(suggestion: AssistantSuggestion): boolean {
  return parseSuggestion(suggestion) !== null;
}

export function useAssistantChat() {
  return useMutation({
    mutationFn: (input: { message: string; language: string; history: AssistantMessage[] }) =>
      fetchJson<AssistantChatResult>("/api/assistant/chat", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useApplySuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestion: AssistantSuggestion) => {
      const config = SECTION_CONFIG[suggestion.section];
      const parsed = parseSuggestion(suggestion);
      if (!parsed) throw new Error("Suggestion data is incomplete.");

      if (suggestion.action === "UPDATE") {
        return fetchJson<unknown>(`${config.endpoint}/${suggestion.targetId}`, {
          method: "PATCH",
          body: JSON.stringify(parsed),
        });
      }
      return fetchJson<unknown>(config.endpoint, {
        method: "POST",
        body: JSON.stringify(parsed),
      });
    },
    onSuccess: (_data, suggestion) => {
      // Prefix invalidation also catches the section's detail queries.
      queryClient.invalidateQueries({ queryKey: SECTION_CONFIG[suggestion.section].queryKey });
    },
  });
}
