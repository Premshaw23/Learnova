import { z } from "zod";

export const ACHIEVEMENT_CATEGORIES = [
  "Academic",
  "Sports",
  "Technical",
  "Cultural",
  "Leadership",
  "Community Service",
  "Competition",
  "Other",
];

export const VERIFICATION_STATUSES = ["Pending", "Verified", "Rejected"];

export const achievementCreateSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  category: z.enum(ACHIEVEMENT_CATEGORIES, {
    errorMap: () => ({ message: "Invalid category" }),
  }),
  certificateUrl: z.string().url("Valid certificate URL is required").optional(),
  achievementDate: z.string().trim().min(1, "Achievement date is required"),
});

export const achievementUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().min(1).max(2000).optional(),
  category: z.enum(ACHIEVEMENT_CATEGORIES).optional(),
  certificateUrl: z.string().url().optional(),
  achievementDate: z.string().trim().min(1).optional(),
});

export const achievementVerifySchema = z.object({
  verificationStatus: z.enum(["Verified", "Rejected"], {
    errorMap: () => ({ message: "Status must be Verified or Rejected" }),
  }),
  remarks: z.string().trim().max(500).optional(),
});
