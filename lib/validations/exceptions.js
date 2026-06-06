import { z } from "zod";
import { ObjectId } from "mongodb";

export const exceptionCreateSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .max(200, "Reason must be under 200 characters"),
  details: z
    .string()
    .trim()
    .min(1, "Details are required")
    .max(1000, "Details must be under 1000 characters"),
  date: z
    .string()
    .trim()
    .min(1, "Date is required"),
});

export const exceptionUpdateSchema = z.object({
  exceptionId: z
    .string()
    .trim()
    .min(1, "exceptionId is required")
    .refine((val) => ObjectId.isValid(val), {
      message: "Invalid exception ID",
    }),
  status: z.enum(["approved", "rejected"], {
    required_error: "Invalid status value",
    invalid_type_error: "Invalid status value",
  }),
  comments: z.string().optional(),
});
