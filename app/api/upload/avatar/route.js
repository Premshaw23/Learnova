import { del } from "@vercel/blob";
import { withErrorHandler } from "@/lib/error-handler";
import { jsonSuccess } from "@/lib/api-response";
import { AppError, ValidationError } from "@/lib/errors";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  extractImageFileFromFormData,
  uploadAvatarToBlob,
  updateUserImageInDb,
} from "@/lib/images/imagesService";

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

  const { blobUrl } = await uploadAvatarToBlob({
    file,
    uid: decodedToken.uid,
  });

  try {
    await updateUserImageInDb({
      firebaseUid: decodedToken.uid,
      imageUrl: blobUrl,
      faceDescriptor: null,
    });
  } catch (error) {
    await del(blobUrl).catch(() => {});
    throw error;
  }

  return jsonSuccess({ url: blobUrl }, 200);
});
