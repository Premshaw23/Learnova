import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError } from "@/lib/errors";
import { jsonSuccess } from "@/lib/api-response";
import { createComplaintSchema } from "@/lib/validations/complaints";
import { validateRequest } from "@/lib/validations/validateRequest";

export const dynamic = "force-dynamic";

const MAX_COMPLAINT_PAYLOAD_BYTES = 1024 * 10;

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

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
