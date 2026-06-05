
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError } from "@/lib/errors";
import { jsonSuccess, fail } from "@/lib/api-response"; //  added fail import
import { createComplaintSchema } from "@/lib/validations/complaints";
import { validateRequest } from "@/lib/validations/validateRequest";
import { checkRateLimit } from "@/lib/rateLimit"; //  added import

export const dynamic = "force-dynamic";

const MAX_COMPLAINT_PAYLOAD_BYTES = 1024 * 10;

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

  //  Rate limit by both IP and userId to prevent spam from authenticated users
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `complaints_post_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    return fail(
      429,
      "TOO_MANY_REQUESTS",
      "Too many complaint submissions. Please wait before submitting again."
    );
  }

  const validationResult = await validateRequest(
    req,
    createComplaintSchema,
    MAX_COMPLAINT_PAYLOAD_BYTES
  );
  if (!validationResult.success) {
    return validationResult.response;
  }

  const { category, subject, description, priority } = validationResult.data;

  let db;
  try {
    db = await connectDb();
  } catch (error) {
    throw new AppError("Database connection failed. Please try again.", 503);
  }

  await db.collection("complaints").insertOne({
    userId: decodedToken.uid,
    userEmail: decodedToken.email,
    category,
    subject,
    description,
    priority,
    status: "pending",
    createdAt: new Date(),
  });

  return jsonSuccess({ message: "Complaint submitted successfully" });
});
