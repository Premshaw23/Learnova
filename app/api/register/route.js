import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { withSecurity } from "@/lib/security/middleware";
import { sanitizeString, sanitizeEmail } from "@/lib/security/sanitizer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const isValidImageMagicBytes = async (file) => {
  try {
    if (typeof file.slice !== "function") return null;
    const headerBuffer = await file.slice(0, 12).arrayBuffer();
    const arr = new Uint8Array(headerBuffer);
    if (arr.length < 4) return null;

    // Check PNG: 89 50 4E 47
    if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47) {
      return "image/png";
    }

    // Check JPEG: FF D8 FF
    if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff) {
      return "image/jpeg";
    }

    // Check WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    if (
      arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46 &&
      arr.length >= 12 &&
      arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50
    ) {
      return "image/webp";
    }

    return null;
  } catch (err) {
    return null;
  }
};

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

export async function POST(req) {
  try {
    // Apply rate limiting
    const securityResult = await withSecurity(req, { rateLimitType: 'auth' });
    if (securityResult instanceof Response) return securityResult;

    const formData = await req.formData();
    const name = sanitizeString(formData.get("name"));
    const rollNo = sanitizeString(formData.get("rollNo"));
    const email = sanitizeEmail(formData.get("email"));
    const file = formData.get("photo");

    if (!name || !rollNo || !email || !file) {
      return jsonError("Name, rollNo, email, and photo are required", 400);
    }

    if (!(file instanceof File)) {
      return jsonError("Photo must be a valid file", 400);
    }

    // Token Authentication & Authorization Check
    const authorization = req.headers.get("authorization");
    const token = authorization?.split(" ")[1];
    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      return jsonError("Unauthorized", 401);
    }

    if (decodedToken.email !== email) {
      return jsonError("Forbidden: You can only register using your authenticated email.", 403);
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError("File too large. Max size is 5MB.", 413);
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return jsonError("Invalid file type. Only JPEG, PNG, and WebP images are allowed.", 400);
    }

    const detectedMimeType = await isValidImageMagicBytes(file);
    if (!detectedMimeType || detectedMimeType !== file.type) {
      return jsonError("Invalid file content. The file headers do not match the expected image format.", 400);
    }

    // Get DB
    const db = await connectDb();
    const users = db.collection("users");

    // Check if user already registered
    const existingUser = await users.findOne({
      $or: [{ rollNo }, { email }],
    });
    if (existingUser) {
      return jsonError("User already registered with a photo", 409);
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_") || "user";
    const fileExtension = getImageExtension(file.type);
    const fileName = `labels/${safeName}/${randomUUID()}.${fileExtension}`;

    // Upload to Vercel Blob
    const blob = await put(fileName, buffer, {
      contentType: file.type || "image/jpeg",
      access: "public",
    });

    try {
      // Save user record in DB
      const user = {
        name,
        rollNo,
        email,
        image: blob.url,
      };
      await users.insertOne(user);

      return jsonSuccess(
        {
          message: "User registered successfully",
          user,
        },
        201,
      );
    } catch (dbError) {
      try {
        await del(blob.url);
      } catch (cleanupError) {
        console.error("Failed to delete orphaned blob during rollback:", cleanupError);
      }
      throw dbError;
    }
  } catch (error) {
    console.error(error);
    return jsonError(error.message || "Internal server error", 500);
  }
}