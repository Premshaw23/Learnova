import { z } from "zod";

const lessonSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Lesson title is required").max(200),
  duration: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  completed: z.boolean().optional(),
});

const moduleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Module title is required").max(200),
  lessons: z.array(lessonSchema).max(100).optional().default([]),
});

export const curriculumSyncSchema = z
  .object({
    courseId: z.string().min(1, "Course ID is required").max(100),
    modules: z.array(moduleSchema).max(50, "Too many modules (max 50)"),
  })
  .strict();
