import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { connectDb } from "@/lib/mongodb";
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const allowedImageHosts = [
  "public.blob.vercel-storage.com",
  "lh3.googleusercontent.com",
];

const imageIdSchema = z.object({
  id: z.string().min(1, "Missing user id parameter"),
});

function normalizeMimeType(contentType = "") {
  return contentType.split(";")[0].trim().toLowerCase();
}

function assertAllowedImageType(contentType, message) {
  const mimeType = normalizeMimeType(contentType);
  if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new ValidationError(message);
  }
  return mimeType;
}

export function validateImageRequestId(id) {
  const validation = imageIdSchema.safeParse({ id });
  if (!validation.success) {
    const firstError = validation.error.issues?.[0]?.message || "Invalid request parameter";
    throw new ValidationError(firstError);
  }

  try {
    return new ObjectId(validation.data.id);
  } catch {
    throw new ValidationError("Invalid user id");
  }
}

export function validateRemoteImageUrl(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ValidationError("Invalid image URL");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new ValidationError("Image URL must use HTTPS");
  }

  const hostOk = allowedImageHosts.some(
    (host) =>
      parsedUrl.hostname === host ||
      parsedUrl.hostname.endsWith(`.${host}`)
  );

  if (!hostOk) {
    throw new ValidationError("Image source not allowed");
  }

  return parsedUrl;
}

export async function getUserImageFromDb({ id, callerUid, callerRole, callerInstituteId }) {
  const objectId = validateImageRequestId(id);

  const db = await connectDb();
  const users = db.collection("users");

  const targetUser = await users.findOne(
    { _id: objectId },
    { projection: { image: 1, firebaseUid: 1, instituteId: 1 } }
  );

  if (!targetUser?.image) {
    throw new NotFoundError("Image not found");
  }

  // Admins can view any image
  if (callerRole === "admin") {
    return targetUser.image;
  }

  // Users can view their own image
  if (targetUser.firebaseUid === callerUid) {
    return targetUser.image;
  }

  // Teachers and Institute Admins can view images of users within their institution
  if (["teacher", "institute"].includes(callerRole) && callerInstituteId && targetUser.instituteId === callerInstituteId) {
    return targetUser.image;
  }

  throw new ForbiddenError("You do not have permission to view this image");
}

export async function fetchAndValidateImage(url) {
  validateRemoteImageUrl(url);

  const response = await fetch(url);
  if (!response.ok) {
    throw new AppError("Failed to fetch image", 502);
  }

  const contentType = response.headers.get("content-type") || "";
  assertAllowedImageType(contentType, "Response is not an allowed image type");

  const contentLength = Number.parseInt(
    response.headers.get("content-length") || "0",
    10
  );

  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_SIZE) {
    throw new AppError("Image exceeds 5MB limit", 502);
  }

  const imageBuffer = await response.arrayBuffer();
  if (imageBuffer.byteLength > MAX_FILE_SIZE) {
    throw new AppError("Image exceeds 5MB limit", 502);
  }

  return {
    imageBuffer,
    contentType: normalizeMimeType(contentType),
  };
}

export function extractImageFileFromFormData(formData) {
  const file = formData.get("file");

  if (!file || typeof file === "string" || !file.type) {
    throw new ValidationError("File is required and must be a valid file");
  }

  return file;
}

export async function uploadAvatarToBlob({ file, uid }) {
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const mimeType = assertAllowedImageType(file.type, "Invalid image type");

  // arrayBuffer() is the supported runtime-safe way to consume multipart files in Next.js route handlers.
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const extension = mimeType.split("/")[1] || "jpg";
  const fileName = `avatars/${uid}-${randomUUID()}.${extension}`;

  const blob = await put(fileName, buffer, {
    contentType: mimeType,
    access: "public",
  });

  return { blobUrl: blob.url };
}

export function validateFaceDescriptor(rawFaceDescriptor) {
  if (!rawFaceDescriptor) return null;

  if (typeof rawFaceDescriptor !== "string") {
    throw new ValidationError("Invalid face descriptor format");
  }

  if (rawFaceDescriptor.length > 20000) {
    throw new ValidationError("Face descriptor payload too large");
  }

  try {
    const parsed = JSON.parse(rawFaceDescriptor);
    const faceDescriptorSchema = z.array(z.number()).length(128);
    const validated = faceDescriptorSchema.parse(parsed);

    // Biometric Spoofing Mitigation: Reject completely zeroed out or near-zero face descriptors
    const sumAbs = validated.reduce((sum, val) => sum + Math.abs(val), 0);
    if (sumAbs < 1e-4) {
      throw new ValidationError("Invalid face descriptor format: Spoofed or empty face descriptor detected");
    }

    return validated;
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError("Invalid face descriptor format");
  }
}

export async function updateUserImageInDb({ firebaseUid, imageUrl, faceDescriptor }) {
  const db = await connectDb();
  const users = db.collection("users");

  const updateDoc = {
    $set: { image: imageUrl },
  };

  if (faceDescriptor) {
    updateDoc.$set.faceDescriptor = faceDescriptor;
  } else {
    updateDoc.$unset = { faceDescriptor: "" };
  }

  const result = await users.updateOne(
    { firebaseUid },
    updateDoc
  );

  if (result.matchedCount === 0) {
    throw new NotFoundError("User profile not found");
  }

  return result;
}

export function getImageResponseHeaders(contentType) {
  return {
    "Content-Type": normalizeMimeType(contentType),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff",
  };
}
