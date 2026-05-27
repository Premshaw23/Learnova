import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
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

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

  const body = await req.json();

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

  await db.collection("complaints").insertOne({
    userId: decodedToken.uid,
    userEmail: decodedToken.email,
    category,
    subject,
    description,
    priority,
    createdAt: new Date(),
  });

  return jsonSuccess({ message: "Complaint submitted successfully" });
});
