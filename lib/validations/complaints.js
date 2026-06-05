import { z } from "zod";

export const createComplaintSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().min(1, "Description is required").max(2000),
  priority: z.string().min(1, "Priority is required"),
  isAnonymous: z.boolean().default(false).optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "resolved", "rejected"]),
  resolutionNotes: z.string().max(1000).optional(),
});
