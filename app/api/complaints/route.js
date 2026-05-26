import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";
import xss from "xss";
import { withErrorHandler, parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { AppError, ValidationError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * Strips all HTML/Script tags to prevent stored XSS attacks.
 */
const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe", "object", "embed"],
  }).trim();
};

// Input validation schema using Zod
const complaintSchema = z.object({
  category: z.enum(["Academic", "Technical", "Hostel", "Other"], {
    errorMap: () => ({ message: "Invalid complaint category" }),
  }),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must not exceed 200 characters")
    .transform(sanitizeText),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000, "Description must not exceed 5000 characters")
    .transform(sanitizeText),
  priority: z.enum(["High", "Medium", "Low"], {
    errorMap: () => ({ message: "Invalid priority value" }),
  }),
});

export const POST = withErrorHandler(async (request) => {
  // 1. Authentication check
  const decodedToken = await requireAuth(request);

  // 2. Rate limiting by IP and User ID to mitigate API abuse/DOS
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`complaints_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  // 3. Payload size check & JSON parsing (Max 10KB)
  const parsedBody = await parseJSON(request, 1024 * 10);

  // 4. Schema validation & input sanitization
  const validation = complaintSchema.safeParse(parsedBody);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { category, subject, description, priority } = validation.data;
  const db = await connectDb();

  // 5. Store complaint securely mapped to authenticated user
  const newComplaint = {
    userId: decodedToken.uid,
    userEmail: decodedToken.email,
    category,
    subject,
    description,
    priority,
    createdAt: new Date(),
  };

  const result = await db.collection("complaints").insertOne(newComplaint);

  return jsonSuccess({
    message: "Complaint submitted successfully",
    complaintId: result.insertedId,
  });
});
