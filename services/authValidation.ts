import { z } from "zod";

// Schema for Authentication request payloads
export const authRequestSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  isMockAuthMode: z.boolean().optional().default(false),
  mockUser: z
    .object({
      id: z.string(),
      email: z.string().email(),
      role: z.string(),
    })
    .optional(),
});

// Schema for Onboarding request payloads
export const onboardingRequestSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required" }),
  instituteId: z.string().min(1, { message: "Institute ID is required" }),
  role: z.enum(["admin", "teacher", "parent", "student"], {
    errorMap: () => ({
      message: "Role must be admin, teacher, parent, or student",
    }),
  }),
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters" }),
});

// Helper utility function to validate payloads safely
export function validateApiPayload(schema: z.ZodSchema, data: unknown) {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      isValid: false,
      errors: result.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    };
  }
  return {
    isValid: true,
    data: result.data,
  };
}
