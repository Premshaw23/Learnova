import { connectDb } from "@/lib/mongodb";
import { jsonSuccess } from "@/lib/api-response";
import { requireStudent } from "@/lib/rbac";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { ValidationError, AppError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import xss from "xss";

export const dynamic = "force-dynamic";

const sanitize = (text) => (typeof text === "string" ? xss(text).trim() : "");

const exceptionCreateSchema = z.object({
  reason: z.string().trim().min(1, "Reason is required").max(200, "Reason must be under 200 characters"),
  details: z.string().trim().min(1, "Details are required").max(1000, "Details must be under 1000 characters"),
  date: z.string().trim().min(1, "Date is required"),
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

  const reason = sanitize(validation.data.reason);
  const details = sanitize(validation.data.details);
  const date = sanitize(validation.data.date);

  const db = await connectDb();
  const exceptionData = {
    reason,
    details,
    date,
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
