import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

export const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_ATTEMPTS = 5;

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
    const formData = await req.formData();
    const name = normalizeText(formData.get("name"));
    const rollNo = normalizeText(formData.get("rollNo"));
    const email = normalizeText(formData.get("email")).toLowerCase();
    const file = formData.get("photo");

    if (!name || !rollNo || !email || !file) {
      return jsonError("Name, rollNo, email, and photo are required", 400);
    }

    if (!EMAIL_PATTERN.test(email)) {
      return jsonError("Invalid email address", 400);
    }

    // Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    const attempts = rateLimitMap.get(ip).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
    attempts.push(now);
    rateLimitMap.set(ip, attempts);

    if (attempts.length > MAX_ATTEMPTS) {
      console.warn(`[Rate Limit] Registration rate limit exceeded for IP: ${ip} at ${new Date(now).toISOString()}`);
      return jsonError("Too many registration attempts. Please try again later.", 429);
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