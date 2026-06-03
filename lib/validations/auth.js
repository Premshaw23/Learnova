import { z } from "zod";

/**
 * Validation schema for User Registration
 * Validates name, email, password, and confirmPassword
 */
export const routeParamSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid character format in route ID"),
});
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "Name must be at least 2 characters." })
      .max(50, { message: "Name must be less than 50 characters." })
      .regex(/^[a-zA-Z\s]*$/, {
        message: "Name can only contain letters and spaces.",
      }),
    email: z
      .string()
      .min(1, { message: "Email is required." })
      .email({ message: "Invalid email address." }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const setRoleSchema = z.object({
  role: z.enum(["student", "teacher", "institute", "parent"], {
    errorMap: () => ({
      message: "Role must be student, teacher, institute, or parent",
    }),
  }),

  fullName: z.string().trim().min(1, "Full name is required").max(100),

  instituteName: z.string().trim().max(200).optional(),

  inviteCode: z.string().trim().max(50).optional(),
});
