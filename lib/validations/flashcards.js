import { z } from "zod";

export const createFlashcardSchema = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  origin: z.string().optional(),
  courseId: z.string().optional(),
  tags: z.array(z.string()).max(50).optional(),
});
