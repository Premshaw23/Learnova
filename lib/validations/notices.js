import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  category: z.enum(["academic", "administrative", "financial", "general", "technical", "all"]).default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).max(50).default([]),
  targetAudience: z.array(z.string()).min(1, "Target audience is required").max(50).optional(),
});

export const updateNoticeSchema = createNoticeSchema.partial();
