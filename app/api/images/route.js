import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import { del } from "@vercel/blob";
import { connectDb } from "@/lib/mongodb";
import { getUserProfile } from "@/lib/firebase-admin";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import logger from "@/utils/logger";
import {
  extractImageFileFromFormData,
  fetchAndValidateImage,
  getImageResponseHeaders,
  getUserImageFromDb,
  updateUserImageInDb,
  uploadAvatarToBlob,
  validateFaceDescriptor,
} from "@/lib/images/imagesService";

export const dynamic = "force-dynamic";

export const GET = withErrorHandler(async (request) => {
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const rateLimitResult = await checkRateLimit(`images_get_${ip}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const decodedToken = await requireAuth(request);
  const profile = await getUserProfile(decodedToken.uid) || { role: "student" };

  const imageUrl = await getUserImageFromDb({ 
    id, 
    callerUid: decodedToken.uid,
    callerRole: profile.role,
    callerInstituteId: profile.instituteId
  });

  logger.info("Image accessed", {
    userId: decodedToken.uid,
    targetId: id,
    timestamp: new Date().toISOString()
  });

  const { imageBuffer, contentType } = await fetchAndValidateImage(imageUrl);

  return new NextResponse(imageBuffer, {
    status: 200,
    headers: getImageResponseHeaders(contentType),
  });
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`images_post_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many attempts. Please try again later.", 429);
  }

  const formData = await request.formData();

  // Validate upfront before performing any upload/DB side effects
  const rawFaceDescriptor = formData.get("faceDescriptor");
  const faceDescriptor = validateFaceDescriptor(rawFaceDescriptor);
  const file = extractImageFileFromFormData(formData);

  // Upload new avatar to Vercel Blob
  const { blobUrl } = await uploadAvatarToBlob({
    file,
    uid: decodedToken.uid,
  });

  try {
    // Atomically update user image and handle face descriptor (unset if not provided)
    await updateUserImageInDb({
      firebaseUid: decodedToken.uid,
      imageUrl: blobUrl,
      faceDescriptor,
    });
  } catch (error) {
    await Promise.resolve(del(blobUrl)).catch(() => {});
    throw error;
  }

  return NextResponse.json({ success: true, url: blobUrl });
});
