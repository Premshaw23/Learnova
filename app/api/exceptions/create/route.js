import { connectDb } from "@/lib/mongodb";
import { requireStudent } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError, ForbiddenError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";
import { exceptionCreateSchema, validateOrThrow } from "@/lib/validations";

export const dynamic = "force-dynamic";

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken, profile } = await requireStudent(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(
    `exceptions_create_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  if (!profile || !profile.instituteId) {
    throw new ForbiddenError(
      "Forbidden: User profile missing institute affiliation."
    );
  }
  const userInstituteId = profile.instituteId;

  const { reason, details, date } = await validateOrThrow(request, exceptionCreateSchema, 1024 * 10);

  const db = await connectDb();

  const exceptionData = {
    reason,
    details,
    date,
    studentEmail: decodedToken.email,
    instituteId: userInstituteId,
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
    201
  );
});
