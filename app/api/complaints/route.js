import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { parseJSON, withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError } from "@/lib/errors";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";


export const dynamic = "force-dynamic";

const complaintsSchema = z.object({
  category: z.string().min(1, "Category is required"),
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.string().min(1, "Priority is required"),
});

const MAX_COMPLAINT_PAYLOAD_BYTES = 1024 * 10;

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

  // Rate limit: max 3 complaints per hour per user
  const rateLimitResult = await checkRateLimit(`complaints_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many complaints. Please try again later.", 429);
  }

  const body = await parseJSON(req, MAX_COMPLAINT_PAYLOAD_BYTES);

  const validation = complaintsSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { category, subject, description, priority } = validation.data;

  let db;
  try {
    db = await connectDb();
  } catch (error) {
    throw new AppError("Database connection failed. Please try again.", 503);
  }

  // Dedupe: reject duplicate identical submissions within the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const existing = await db.collection("complaints").findOne({
    userId: decodedToken.uid,
    subject,
    description,
    createdAt: { $gte: oneHourAgo },
  });
  if (existing) {
    throw new AppError("Duplicate complaint: A similar complaint was already submitted recently.", 409);
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
