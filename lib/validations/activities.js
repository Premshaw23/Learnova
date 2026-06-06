import { z } from "zod";

const ALLOWED_TYPES = ["course", "quiz", "assignment"];

export const activitySchema = z.object({
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title cannot be empty")
    .max(200, "title must be 200 characters or fewer")
    .trim(),
  type: z
    .enum(ALLOWED_TYPES, {
      errorMap: () => ({
        message: `type must be one of: ${ALLOWED_TYPES.join(", ")}`,
      }),
    })
    .default("course"),
  progress: z
    .number({ invalid_type_error: "progress must be a number" })
    .int("progress must be an integer")
    .min(0, "progress must be at least 0")
    .max(100, "progress must be at most 100")
    .default(0),
});
