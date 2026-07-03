import { z } from "zod";

/**
 * Education Zod schemas.
 * Same dual-use pattern as certification.schema.ts:
 * API route validation + react-hook-form client validation.
 */

const educationShape = z.object({
  institution: z.string().min(1, "Institution is required.").max(200),
  degree:      z.string().min(1, "Degree is required.").max(200),
  field:       z.string().max(200).optional(),
  startDate:   z.coerce.date().optional(),
  endDate:     z.coerce.date().optional(),
  isOngoing:   z.boolean().default(false),
  skills:      z.array(z.string().min(1).max(100)).max(20).default([]),
});

const noEndBeforeStart = (data: { startDate?: Date; endDate?: Date }) => {
  if (data.startDate && data.endDate && data.endDate < data.startDate) return false;
  return true;
};

export const createEducationSchema = educationShape.refine(noEndBeforeStart, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

export const updateEducationSchema = educationShape
  .partial()
  .extend({
    id: z.string().min(1, "Invalid education ID."),
  })
  .refine(noEndBeforeStart, {
    message: "End date cannot be before start date.",
    path: ["endDate"],
  });

export type CreateEducationInput = z.infer<typeof createEducationSchema>;
export type UpdateEducationInput = z.infer<typeof updateEducationSchema>;
