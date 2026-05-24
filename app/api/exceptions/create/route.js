import { connectDb } from "@/lib/mongodb";
import { requireStudent } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const exceptionCreateSchema = z.object({
  reason: z
    .string({
      required_error: "Reason is required",
      invalid_type_error: "Reason must be a string",
    })
    .trim()
    .min(1, "Reason is required")
    .max(200, "Reason must be under 200 characters"),
  details: z
    .string({
      required_error: "Details are required",
      invalid_type_error: "Details must be a string",
    })
    .trim()
    .min(1, "Details are required")
    .max(1000, "Details must be under 1000 characters"),
  date: z
    .string({
      required_error: "Date is required",
      invalid_type_error: "Date must be a string",
    })
    .trim()
    .min(1, "Date is required"),
});

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireStudent(request);
  const body = await request.json();
  
  const validation = exceptionCreateSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }
  
  const { reason, details, date } = validation.data;

    const db = await connectDb();

    const exceptionData = {
      reason: reason.trim(),
      details: details.trim(),
      date: date.trim(),
      studentEmail: decodedToken.email,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("exceptions").insertOne(exceptionData);

    return jsonSuccess(
      {
        id: result.insertedId,
        message: "Exception request created successfully",
      },
      201,
    );
});
