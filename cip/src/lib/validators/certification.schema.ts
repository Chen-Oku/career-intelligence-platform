import { z } from "zod";

/**
 * Certification Zod schemas.
 * Same dual-use pattern as skill.schema.ts:
 * API route validation + react-hook-form client validation.
 */

const optionalUrl = z
  .string()
  .url("Must be a valid URL (include https://)")
  .optional()
  .or(z.literal(""));

const certificationShape = z.object({
  name:          z.string().min(1, "Certification name is required.").max(200),
  issuer:        z.string().min(1, "Issuer is required.").max(200),
  issueDate:     z.coerce.date().optional(),
  expiryDate:    z.coerce.date().optional(),
  credentialId:  z.string().max(200).optional(),
  credentialUrl: optionalUrl,
  skills:        z.array(z.string().min(1).max(100)).max(20).default([]),
});

const noExpiryBeforeIssue = (data: { issueDate?: Date; expiryDate?: Date }) => {
  if (data.issueDate && data.expiryDate && data.expiryDate < data.issueDate) return false;
  return true;
};

export const createCertificationSchema = certificationShape.refine(noExpiryBeforeIssue, {
  message: "Expiry date cannot be before issue date.",
  path: ["expiryDate"],
});

export const updateCertificationSchema = certificationShape
  .partial()
  .extend({
    id: z.string().min(1, "Invalid certification ID."),
  })
  .refine(noExpiryBeforeIssue, {
    message: "Expiry date cannot be before issue date.",
    path: ["expiryDate"],
  });

export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
