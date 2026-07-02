import { z } from "zod";

/**
 * Experience Zod Schemas
 *
 * Zod serves as the boundary validator between the outside world
 * (HTTP requests, form submissions) and our application layer.
 *
 * The same schema is used in two places:
 * 1. API route — validates incoming POST/PATCH bodies
 * 2. Client form — via @hookform/resolvers/zod for form validation
 *
 * This means validation rules are defined once and enforced in both places.
 * If you add a new field constraint here, it applies to both the API
 * and the UI form automatically.
 *
 * Note: These are NOT the same as domain business rules.
 * Zod validates format and structure ("is this a valid date string?").
 * The domain entity validates invariants ("can this date range exist?").
 */

const experienceShape = z.object({
  company: z
    .string({ required_error: "Company is required." })
    .min(1, "Company cannot be empty.")
    .max(200),

  position: z
    .string({ required_error: "Position is required." })
    .min(1, "Position cannot be empty.")
    .max(200),

  industry: z.string().max(100).optional(),

  location: z.string().max(200).optional(),

  // z.coerce.date() handles ISO strings coming in from JSON
  startDate: z.coerce.date({ required_error: "Start date is required." }),

  endDate: z.coerce.date().optional(),

  isCurrent: z.boolean({ required_error: "isCurrent is required." }),

  responsibilities: z
    .array(z.string().min(1).max(500))
    .min(1, "At least one responsibility is required.")
    .max(20, "Maximum 20 responsibilities allowed."),

  achievements: z
    .array(z.string().min(1).max(500))
    .max(20)
    .default([]),

  technologies: z
    .array(z.string().min(1).max(100))
    .max(50)
    .default([]),

  skills: z
    .array(z.string().min(1).max(100))
    .max(50)
    .default([]),

  hasLeadership: z.boolean().default(false),

  teamSize: z.number().int().positive().max(10_000).optional(),

  challenges: z.string().max(2000).optional(),

  starStory: z.string().max(3000).optional(),

  portfolioLinks: z
    .array(z.string().url("Each portfolio link must be a valid URL."))
    .max(10)
    .default([]),

  order: z.number().int().default(0),
});

const validDateConfig = (data: {
  isCurrent?: boolean;
  startDate?: Date;
  endDate?: Date;
}) => {
  // A current position must not have an end date
  if (data.isCurrent && data.endDate) return false;
  // A past position's end date must be after start date
  if (!data.isCurrent && data.endDate && data.startDate && data.endDate < data.startDate) {
    return false;
  }
  return true;
};

export const createExperienceSchema = experienceShape.refine(validDateConfig, {
  message: "Invalid date configuration: check start date, end date, and isCurrent.",
  path: ["endDate"],
});

// For PATCH — all fields optional, but id required
export const updateExperienceSchema = experienceShape
  .partial()
  .extend({
    id: z.string().min(1, "Invalid experience ID."),
  })
  .refine(validDateConfig, {
    message: "Invalid date configuration: check start date, end date, and isCurrent.",
    path: ["endDate"],
  });

// TypeScript types derived from schemas — single source of truth
export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
