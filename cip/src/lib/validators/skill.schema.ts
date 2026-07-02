import { z } from "zod";

const SKILL_CATEGORIES = [
  "TECHNICAL", "SOFT", "LANGUAGE", "FRAMEWORK",
  "METHODOLOGY", "LEADERSHIP", "AI", "DESIGN", "PROGRAMMING", "OTHER",
] as const;

const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

const skillShape = z.object({
  name:       z.string().min(1, "Skill name is required.").max(100),
  category:   z.enum(SKILL_CATEGORIES, { required_error: "Category is required." }),
  // Required for every category except SOFT — enforced by the refine below.
  level:      z.enum(SKILL_LEVELS).optional(),
  yearsOfExp: z.number().positive().max(50).optional(),
  lastUsed:   z.coerce.date().optional(),
  isPublic:   z.boolean().default(true),
  tags:       z.array(z.string().max(50)).max(10).default([]),
});

const levelRequiredUnlessSoft = (data: { category?: string; level?: string }) => {
  if (data.category && data.category !== "SOFT" && !data.level) return false;
  return true;
};

export const createSkillSchema = skillShape.refine(levelRequiredUnlessSoft, {
  message: "Level is required for this skill category.",
  path: ["level"],
});

export const updateSkillSchema = skillShape
  .partial()
  .extend({
    id: z.string().min(1, "Invalid skill ID."),
  })
  .refine(levelRequiredUnlessSoft, {
    message: "Level is required for this skill category.",
    path: ["level"],
  });

export type CreateSkillInput = z.infer<typeof createSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;

// Re-export for convenience in components
export { SKILL_CATEGORIES, SKILL_LEVELS };
