import { del } from "@vercel/blob";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError, ValidationError } from "@/lib/errors";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  extractImageFileFromFormData,
  updateUserImageInDb,
} from "@/lib/images/imagesService";
import {
  processAndUploadFile,
  activeStorage,
} from "@/lib/services/uploadService";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  const rateLimitResult = await checkRateLimit(
    `avatar_upload_${ip}_${decodedToken.uid}`
  );

  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const formData = await request.formData();
  const file = extractImageFileFromFormData(formData);

  if (file.size <= 0) {
    throw new ValidationError("File is empty");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const { url } = await processAndUploadFile(
    file,
    `avatars/${decodedToken.uid}`
  );

  try {
    await updateUserImageInDb({
      firebaseUid: decodedToken.uid,
      imageUrl: url,
      faceDescriptor: null,
    });
  } catch (error) {
    await activeStorage.delete(url).catch(() => {});
    throw error;
  }

  return jsonSuccess({ url }, 200);
});
