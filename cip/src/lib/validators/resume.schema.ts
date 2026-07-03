import { z } from "zod";

const RESUME_TYPES = [
  "MASTER", "ARCHVIZ", "GAMEPLAY", "TECHNICAL_ARTIST",
  "GRAPHIC_DESIGNER", "BTL", "ENVIRONMENT_ARTIST", "VFX", "CUSTOM",
] as const;

export const contactSchema = z.object({
  email:     z.string().email().optional().or(z.literal("")),
  phone:     z.string().max(30).optional(),
  linkedin:  z.string().max(200).optional(),
  portfolio: z.string().max(200).optional(),
  location:  z.string().max(100).optional(),
});

/**
 * Resume defaults stored on the user profile (User.contactInfo) and
 * prefilled into the resume generator so contact info isn't retyped per
 * resume. Education used to live here too (User.education) but now comes
 * from the Education entity instead — fetched automatically during
 * generation, same as Certifications.
 */
export const resumeDefaultsSchema = z.object({
  contact: contactSchema,
});

export type ResumeDefaultsInput = z.infer<typeof resumeDefaultsSchema>;

export const generateResumeSchema = z.object({
  type:       z.enum(RESUME_TYPES, { required_error: "Resume type is required." }),
  title:      z.string().min(1, "Title is required.").max(200),
  targetRole: z.string().max(200).optional(),
  language:   z.enum(["en", "es"]).default("en"),
  contact:    contactSchema,
  // When set, the resume is tailored to a previously analyzed job posting:
  // its keywords/required skills are injected into the generation prompt.
  jobDescriptionId: z.string().optional(),
});

export type GenerateResumeInput = z.infer<typeof generateResumeSchema>;
export { RESUME_TYPES };

// ─── Resume editor (PATCH /api/resumes/[id]) ──────────────────────────────────

const experienceItemSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()),
});

const skillGroupSchema = z.object({
  category: z.string().min(1),
  items: z.array(z.string()),
});

const educationItemSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  year: z.string().optional(),
});

const projectItemSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  technologies: z.array(z.string()),
  url: z.string().nullable().optional(),
});

export const updateResumeContentSchema = z.object({
  content: z.object({
    summary: z.string(),
    experience: z.array(experienceItemSchema),
    skills: z.array(skillGroupSchema),
    education: z.array(educationItemSchema),
    projects: z.array(projectItemSchema).optional(),
    sectionVisibility: z.object({ projects: z.boolean().optional() }).optional(),
  }),
  contact: contactSchema,
  targetRole: z.string().max(200).optional(),
});

export type UpdateResumeContentInput = z.infer<typeof updateResumeContentSchema>;

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
