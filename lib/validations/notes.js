import { z } from "zod";

export const createNoteSchema = z.object({
  text: z
    .string()
    .min(1, "Note content cannot be empty")
    .max(1000, "Note content cannot exceed 1000 characters"),
  timestamp: z
    .number({
      required_error: "Timestamp is required",
      invalid_type_error: "Timestamp must be a number",
    })
    .nonnegative("Timestamp must be a non-negative number"),
  videoId: z
    .string()
    .min(1, "Video ID is required"),
  courseId: z
    .string()
    .optional(),
});

export const updateNoteSchema = z.object({
  text: z
    .string()
    .min(1, "Note content cannot be empty")
    .max(1000, "Note content cannot exceed 1000 characters")
    .optional(),
  timestamp: z
    .number()
    .nonnegative("Timestamp must be a non-negative number")
    .optional(),
});
