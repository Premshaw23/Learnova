import { connectDb } from "@/lib/mongodb";
import { requireStudent } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { NextResponse } from "next/server";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const exceptionCreateSchema = z.object({
  reason: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Reason is required"
          : "Reason must be a string",
    })
    .trim()
    .min(1, "Reason is required")
    .max(200, "Reason must be under 200 characters"),
  details: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Details are required"
          : "Details must be a string",
    })
    .trim()
    .min(1, "Details are required")
    .max(1000, "Details must be under 1000 characters"),
  date: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? "Date is required"
          : "Date must be a string",
    })
    .trim()
    .min(1, "Date is required"),
});

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireStudent(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`exceptions_create_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }
  const body = await parseJSON(request, 1024 * 10);
  
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
