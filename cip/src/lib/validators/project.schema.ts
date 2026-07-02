import { z } from "zod";

/**
 * Project Zod schemas.
 * Same dual-use pattern as experience.schema.ts:
 * API route validation + react-hook-form client validation.
 */

const optionalUrl = z
  .string()
  .url("Must be a valid URL (include https://)")
  .optional()
  .or(z.literal(""));

const projectShape = z.object({
  name: z.string().min(1, "Project name is required.").max(200),

  description: z
    .string()
    .min(1, "Description is required.")
    .max(2000, "Maximum 2000 characters."),

  goal: z.string().max(1000).optional(),

  technologies: z.array(z.string().min(1).max(100)).max(30).default([]),

  teamSize: z.number().int().positive().max(10_000).optional(),

  myRole: z.string().max(200).optional(),

  challenges: z.string().max(2000).optional(),

  results: z.string().max(2000).optional(),

  lessonsLearned: z.string().max(2000).optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),

  isHighlighted: z.boolean().default(false),

  isPublic: z.boolean().default(false),

  tags: z.array(z.string().min(1).max(50)).max(20).default([]),

  externalUrl: optionalUrl,

  githubUrl: optionalUrl,

  order: z.number().int().default(0),
});

const noEndBeforeStart = (data: { startDate?: Date; endDate?: Date }) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) {
    return false;
  }
  return true;
};

export const createProjectSchema = projectShape.refine(noEndBeforeStart, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

export const updateProjectSchema = projectShape
  .partial()
  .extend({
    id: z.string().min(1, "Invalid project ID."),
  })
  .refine(noEndBeforeStart, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
