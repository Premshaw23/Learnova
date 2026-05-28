import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import xss from "xss";
import { z } from "zod";

import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { suggestEmailCorrection } from "@/utils/emailValidation";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { AppError, ValidationError, ForbiddenError } from "@/lib/errors";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  rollNo: z.string().trim().min(1, "Roll number is required").max(50),
  email: z.string().trim().email("Invalid email format").toLowerCase(),
});

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");

const getImageExtension = (mimeType) => {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
};

const validateMagicBytes = (buffer, mimeType) => {
  const magic = MAGIC_BYTES[mimeType];
  if (!magic || buffer.length < magic.length) {
    return false;
  }

  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) {
      return false;
    }
  }

  if (mimeType === "image/webp") {
    if (buffer.length < 12) {
      return false;
    }
    for (let i = 0; i < WEBP_MARKER.length; i++) {
      if (buffer[8 + i] !== WEBP_MARKER[i]) {
        return false;
      }
    }
  }

  return true;
};

let indexesEnsured = false;
async function ensureUserIndexes(collection) {
  if (indexesEnsured) {
    return;
  }
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ rollNo: 1 }, { unique: true, sparse: true });
  indexesEnsured = true;
}

export const POST = withErrorHandler(async (req) => {
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`register_ip_${ip}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many registration attempts. Please try again later.", 429);
  }

  const decodedToken = await authenticateRequest(req);
  const formData = await req.formData();

  const rawName = formData.get("name");
  const rawRollNo = formData.get("rollNo");
  const rawEmail = formData.get("email");
  const file = formData.get("photo");
  const rawFaceDescriptor = formData.get("faceDescriptor");

  const validationResult = registerSchema.safeParse({
    name: rawName,
    rollNo: rawRollNo,
    email: rawEmail,
  });

  if (!validationResult.success) {
    return jsonError(validationResult.error.issues?.[0]?.message || "Validation failed", 400);
  }

  const name = xss(validationResult.data.name);
  const rollNo = xss(validationResult.data.rollNo);
  const email = validationResult.data.email;

  const suggestion = suggestEmailCorrection(email);
  if (suggestion && suggestion.correctedEmail !== email) {
    return jsonError(
      `Did you mean ${suggestion.correctedEmail}?`,
      400,
      { suggestedEmail: suggestion.correctedEmail },
    );
  }

  if (!file || typeof file === "string" || !file.type) {
    return jsonError("Photo is required and must be a valid file", 400);
  }

  if (decodedToken.email !== email) {
    throw new ForbiddenError("Forbidden: Cannot register face for another user");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ValidationError("Invalid image type");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length > MAX_FILE_SIZE) {
    return jsonError("File too large. Maximum allowed size is 5 MB.", 413);
  }

  if (!validateMagicBytes(buffer, file.type)) {
    return jsonError("Invalid image content", 415);
  }

  let faceDescriptor = null;
  if (rawFaceDescriptor) {
    try {
      faceDescriptor = JSON.parse(rawFaceDescriptor);
      if (!Array.isArray(faceDescriptor)) {
        return jsonError("Invalid face descriptor format", 400);
      }
    } catch {
      return jsonError("Invalid face descriptor format", 400);
    }
  }

  const db = await connectDb();
  const users = db.collection("users");
  await ensureUserIndexes(users);

  const existingUser = await users.findOne({ $or: [{ rollNo }, { email }] });
  if (existingUser) {
    throw new AppError("User already registered", 409);
  }

  const safeName = normalizeText(name).replace(/[^a-zA-Z0-9_-]/g, "_") || "user";
  const fileExtension = getImageExtension(file.type);
  const fileName = `labels/${safeName}/${randomUUID()}.${fileExtension}`;

  const blob = await put(fileName, buffer, {
    contentType: file.type,
    access: "public",
  });

  try {
    const userDoc = {
      name,
      rollNo,
      email,
      image: blob.url,
      firebaseUid: decodedToken.uid,
    };

    if (faceDescriptor) {
      userDoc.faceDescriptor = faceDescriptor;
    }

    const result = await users.insertOne(userDoc);

    return jsonSuccess(
      {
        message: "User registered successfully",
        user: {
          _id: result.insertedId,
          name: userDoc.name,
          rollNo: userDoc.rollNo,
          email: userDoc.email,
        },
      },
      201,
    );
  } catch (dbError) {
    try {
      if (blob?.url) {
        await del(blob.url);
      }
    } catch (cleanupError) {
      console.error("Failed cleanup:", cleanupError);
    }

    if (dbError?.code === 11000) {
      throw new AppError("User already registered", 409);
    }

    throw dbError;
  }
});
