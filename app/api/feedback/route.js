import { connectDb } from "@/lib/mongodb";
import { jsonSuccess } from "@/lib/api-response";
import { z } from "zod";
import xss from "xss";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { ValidationError } from "@/lib/errors";

export const dynamic = "force-dynamic";

const sanitizeText = (text) => {
  if (typeof text !== "string") return "";
  return xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style", "iframe"],
  }).trim();
};

const feedbackSchema = z.object({
  category: z.enum(["bug", "feature", "ui", "other"]),
  description: z.string().min(20).max(2000).transform(sanitizeText),
  page: z.string().max(200).transform(sanitizeText),
  userRole: z.string().max(50).transform(sanitizeText),
});

export const POST = withErrorHandler(async (req) => {
  const decodedToken = await requireAuth(req);

  let parsedBody;
  try {
    parsedBody = await req.json();
  } catch {
    throw new ValidationError("Invalid JSON payload");
  }

  const validation = feedbackSchema.safeParse(parsedBody);
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request payload";
    throw new ValidationError(firstError);
  }

  const { category, description, page, userRole } = validation.data;
  const db = await connectDb();

  const feedback = {
    userId: decodedToken.uid,
    userEmail: decodedToken.email,
    category,
    description,
    page,
    userRole,
    createdAt: new Date(),
    resolved: false,
  };

  await db.collection("feedback").insertOne(feedback);

  return jsonSuccess(feedback, 201);
});
