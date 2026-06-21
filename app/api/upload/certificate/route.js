import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError, ValidationError } from "@/lib/errors";
import { requireRole } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { processAndUploadCertificate } from "@/lib/services/uploadService";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const POST = withErrorHandler(async (request) => {
  const { payload: decodedToken } = await requireRole(request, [
    "teacher",
    "admin",
  ]);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  const rateLimitResult = await checkRateLimit(
    `certificate_upload_${ip}_${decodedToken.uid}`
  );
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    throw new ValidationError("Certificate file is required");
  }

  if (file.size <= 0) {
    throw new ValidationError("File is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const { url, mimeType } = await processAndUploadCertificate(
    file,
    `certificates/${decodedToken.uid}`
  );

  return jsonSuccess({ url, mimeType }, 200);
});
