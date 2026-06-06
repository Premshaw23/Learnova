import { z } from "zod";

export const registerFaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100),
  rollNo: z
    .string()
    .trim()
    .min(1, "Roll number is required")
    .max(50),
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .toLowerCase(),
});
