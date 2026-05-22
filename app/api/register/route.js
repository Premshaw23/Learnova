import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { suggestEmailCorrection } from "@/utils/emailValidation";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

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
    // 1. Authenticate Request
    const authorization = req.headers.get("authorization");
    const token = authorization?.split(" ")[1];

    if (!token) {
      return jsonError("Unauthorized: No token provided", 401);
    }

    const decodedToken = await verifyFirebaseToken(token);
    if (!decodedToken) {
      return jsonError("Unauthorized: Invalid token", 401);
    }

    const formData = await req.formData();
    const name = normalizeText(formData.get("name"));
    const rollNo = normalizeText(formData.get("rollNo"));
    const email = normalizeText(formData.get("email")).toLowerCase();
    const file = formData.get("photo");

    if (!name || !rollNo || !email || !file) {
      return jsonError("Name, rollNo, email, and photo are required", 400);
    }

    // 2. Prevent arbitrary registrations - Must register own email
    if (decodedToken.email !== email) {
      return jsonError("Forbidden: Cannot register face for a different user", 403);
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
  } catch (error) {
    console.error(error);
    return jsonError(error.message || "Internal server error", 500);
  }
}
