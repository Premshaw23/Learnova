import { z } from "zod";

export const createNoticeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(5000),
  category: z
    .enum([
      "academic",
      "administrative",
      "financial",
      "general",
      "technical",
      "all",
    ])
    .default("general"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  isPinned: z.boolean().default(false),
  tags: z.array(z.string()).max(50).default([]),
  targetAudience: z
    .array(z.string())
    .min(1, "Target audience is required")
    .max(50)
    .optional(),

  // feat #2184: rich media attachments (PDFs, images, links)
  // Files are uploaded via POST /api/notices/upload to Vercel Blob
  // and the returned URL is stored here alongside metadata.
  attachments: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1), // MIME type or "link"
        size: z.number().min(0), // bytes, 0 for links
        url: z.string().url(),
      })
    )
    .max(3, "Maximum 3 attachments allowed")
    .default([]),
});

export const updateNoticeSchema = createNoticeSchema.partial();
