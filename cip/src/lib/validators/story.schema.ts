import { z } from "zod";

const STORY_CATEGORIES = [
  "LEADERSHIP", "CONFLICT", "INNOVATION", "FAILURE", "PROBLEM_SOLVING",
  "COMMUNICATION", "ADAPTABILITY", "LEARNING", "MENTORING",
  "CUSTOMER_SUCCESS", "PROJECT_MANAGEMENT",
] as const;

export const createStorySchema = z.object({
  title:     z.string().min(1, "Title is required.").max(200),
  category:  z.enum(STORY_CATEGORIES, { required_error: "Category is required." }),
  situation: z.string().min(1, "Situation is required.").max(2000),
  task:      z.string().min(1, "Task is required.").max(2000),
  action:    z.string().min(1, "Action is required.").max(3000),
  result:    z.string().min(1, "Result is required.").max(2000),
  impact:    z.string().max(500).optional(),
  skills:    z.array(z.string().max(100)).max(20).default([]),
  keywords:  z.array(z.string().max(100)).max(30).default([]),
});

export const updateStorySchema = createStorySchema.partial().extend({
  id: z.string().min(1, "Invalid story ID."),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;

export { STORY_CATEGORIES };
