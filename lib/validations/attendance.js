import { z } from "zod";

export const recordAttendanceSchema = z.object({
  userId: z.string().min(1, "userId is required").max(128),
  studentName: z.string().min(1).max(100).optional(),
  email: z.string().email("Invalid email").optional(),
  confidenceScore: z.number().min(0).max(100).default(0),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});

export const validatePasscodeSchema = z.object({
  passcode: z.string().min(1, "Passcode is required").max(20),
  classId: z.string().min(1).max(128),
});

export const attendanceHeatmapQuerySchema = z.object({
  userId: z.string().min(1).max(128),
  year: z.coerce.number().int().min(2020).max(2030).optional(),
});
