import { z } from "zod";

const RESUME_TYPES = [
  "MASTER", "ARCHVIZ", "GAMEPLAY", "TECHNICAL_ARTIST",
  "GRAPHIC_DESIGNER", "BTL", "ENVIRONMENT_ARTIST", "VFX", "CUSTOM",
] as const;

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution required").max(200),
  degree:      z.string().min(1, "Degree required").max(200),
  field:       z.string().max(100).optional(),
  year:        z.string().max(10).optional(),
});

export const contactSchema = z.object({
  email:     z.string().email().optional().or(z.literal("")),
  phone:     z.string().max(30).optional(),
  linkedin:  z.string().max(200).optional(),
  portfolio: z.string().max(200).optional(),
  location:  z.string().max(100).optional(),
});

/**
 * Resume defaults stored on the user profile (User.education/contactInfo)
 * and prefilled into the resume generator so they aren't retyped per resume.
 * Unlike generateResumeSchema, education may be empty here — having no
 * defaults saved yet is a valid state.
 */
export const resumeDefaultsSchema = z.object({
  education: z.array(educationSchema).max(5),
  contact:   contactSchema,
});

export type ResumeDefaultsInput = z.infer<typeof resumeDefaultsSchema>;

export const generateResumeSchema = z.object({
  type:       z.enum(RESUME_TYPES, { required_error: "Resume type is required." }),
  title:      z.string().min(1, "Title is required.").max(200),
  targetRole: z.string().max(200).optional(),
  language:   z.enum(["en", "es"]).default("en"),
  education:  z.array(educationSchema).min(1, "Add at least one education entry.").max(5),
  contact:    contactSchema,
  // When set, the resume is tailored to a previously analyzed job posting:
  // its keywords/required skills are injected into the generation prompt.
  jobDescriptionId: z.string().optional(),
});

export type GenerateResumeInput = z.infer<typeof generateResumeSchema>;
export { RESUME_TYPES };

export const RESUME_TYPE_LABELS: Record<string, string> = {
  MASTER:            "Master Resume",
  ARCHVIZ:           "Architectural Visualization",
  GAMEPLAY:          "Gameplay / Level Design",
  TECHNICAL_ARTIST:  "Technical Artist",
  GRAPHIC_DESIGNER:  "Graphic Designer",
  BTL:               "BTL / Brand Activation",
  ENVIRONMENT_ARTIST:"Environment Artist",
  VFX:               "VFX Artist",
  CUSTOM:            "Custom (specify target role)",
};
