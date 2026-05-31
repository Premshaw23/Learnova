import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { connectDb } from "@/lib/mongodb";
import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { AppError, ValidationError, ForbiddenError } from "@/lib/errors";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rateLimit";
import { executeSaga, findExistingOperation, markIdempotent } from "@/lib/transactionCoordinator";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

const registerSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Name is required" : undefined,
    })
    .trim()
    .min(1, "Name is required")
    .max(100),
  rollNo: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Roll number is required" : undefined,
    })
    .trim()
    .min(1, "Roll number is required")
    .max(50),
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Email is required" : undefined,
    })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),
});

const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : "";

/**
 * Escapes HTML characters inside input values to prevent Stored XSS
 * vulnerabilities in fields that are stored and rendered (CWE-79).
 */
const sanitizeHtml = (text) => {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
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

// Ensure unique indexes are created exactly once per process lifetime.
let _indexesEnsured = false;
async function ensureUserIndexes(collection) {
  if (_indexesEnsured) return;
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ rollNo: 1 }, { unique: true, sparse: true });
  _indexesEnsured = true;
}

export const POST =
  withErrorHandler(
    async (req) => {
      // Rate limiting
      const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
      const rateLimitResult = await checkRateLimit(`register_ip_${ip}`);

      if (!rateLimitResult.allowed) {
        throw new AppError("Too many registration attempts. Please try again later.", 429);
      }

      // Authenticate
      const decodedToken = await requireAuth(req);

      // Form data
      const formData =
        await req.formData();

      // Check for idempotency key to prevent duplicate registrations on retry
      const idempotencyKey = formData.get("idempotencyKey");
      if (idempotencyKey && typeof idempotencyKey === "string") {
        const existing = await findExistingOperation(idempotencyKey);
        if (existing?.idempotentResult) {
          return jsonSuccess(existing.idempotentResult, 201);
        }
      }

      const rawName =
        formData.get(
          "name"
        );

      const rawRollNo =
        formData.get(
          "rollNo"
        );

      const rawEmail =
        formData.get(
          "email"
        );

      const file =
        formData.get(
          "photo"
        );

      const rawFaceDescriptor = formData.get("faceDescriptor");
      let faceDescriptor = null;
      if (rawFaceDescriptor) {
        try {
          faceDescriptor = JSON.parse(rawFaceDescriptor);
          if (!Array.isArray(faceDescriptor)) {
            throw new Error();
          }
        } catch {
          return jsonError("Invalid face descriptor format", 400);
        }
      }

      // Validate fields
      const validationResult =
        registerSchema.safeParse(
          {
            name: rawName,
            rollNo:
              rawRollNo,
            email:
              rawEmail,
          }
        );

      if (
        !validationResult.success
      ) {
        return jsonError(
          validationResult.error.issues?.[0]?.message || "Validation failed",
          400
        );
      }

      const {
        name,
        rollNo,
        email,
      } =
        validationResult.data;

      const sanitizedName = sanitizeHtml(name);
      const sanitizedRollNo = sanitizeHtml(rollNo);

      // Validate file
      if (
        !file ||
        typeof file ===
          "string" ||
        !file.type
      ) {
        return jsonError(
          "Photo is required and must be a valid file",
          400
        );
      }

      // Prevent another user registration
      if (
        decodedToken.email !==
        email
      ) {
        throw new ForbiddenError(
          "Forbidden: Cannot register face for another user"
        );
      }

      // File size
      if (
        file.size >
        MAX_FILE_SIZE
      ) {
        throw new ValidationError(
          "File size exceeds 5MB limit"
        );
      }

      // File type
      if (
        !ALLOWED_IMAGE_TYPES.has(
          file.type
        )
      ) {
        throw new ValidationError(
          "Invalid image type"
        );
      }

      // Convert to buffer
      const arrayBuffer =
        await file.arrayBuffer();

      const buffer =
        Buffer.from(
          arrayBuffer
        );

      // Validate actual size
      if (
        buffer.length >
        MAX_FILE_SIZE
      ) {
        return jsonError(
          `File too large. Maximum allowed size is ${
            MAX_FILE_SIZE /
            1024 /
            1024
          } MB.`,
          413
        );
      }

      // Validate magic bytes
      if (
        !validateMagicBytes(
          buffer,
          file.type
        )
      ) {
        return jsonError(
          "Invalid image content",
          415
        );
      }

      // Database
      const db =
        await connectDb();

      const users =
        db.collection(
          "users"
        );

      // Ensure unique indexes exist (idempotent, runs once per process)
      await ensureUserIndexes(users);

      // Application-layer duplicate check (fast path — avoids unnecessary blob upload)
      const existingUser =
        await users.findOne({
          $or: [
            { rollNo },
            { email },
          ],
        });

      if (existingUser) {
        throw new AppError(
          "User already registered",
          409
        );
      }

      // Generate filename
      const safeName =
        normalizeText(
          name
        ).replace(
          /[^a-zA-Z0-9_-]/g,
          "_"
        ) || "user";

      const fileExtension =
        getImageExtension(
          file.type
        );

      const fileName = `labels/${safeName}/${randomUUID()}.${fileExtension}`;

      const sagaKey = idempotencyKey || `register_${decodedToken.uid}_${Date.now()}`;

      const sagaResult = await executeSaga({
        operationType: "register",
        uid: decodedToken.uid,
        steps: [
          {
            name: "upload_blob",
            execute: async () => {
              const blob =
                await put(
                  fileName,
                  buffer,
                  {
                    contentType:
                      file.type,
                    access:
                      "public",
                  }
                );
              // Store blob URL on the saga context for subsequent steps
              sagaResult._blobUrl = blob.url;
              return blob;
            },
            compensate: async () => {
              if (sagaResult._blobUrl) {
                try {
                  await del(sagaResult._blobUrl);
                } catch {}
              }
            },
          },
          {
            name: "write_mongodb",
            execute: async () => {
              const user = {
                name: sanitizedName,
                rollNo: sanitizedRollNo,
                email,
                image: sagaResult._blobUrl,
                firebaseUid: decodedToken.uid,
              };

              if (faceDescriptor) {
                user.faceDescriptor = faceDescriptor;
              }

              const result =
                await users.insertOne(
                  user
                );

              sagaResult._insertedUser = {
                _id: result.insertedId,
                name: user.name,
                rollNo: user.rollNo,
                email: user.email,
              };
            },
            compensate: async () => {
              if (sagaResult._insertedUser?._id) {
                try {
                  await users.deleteOne({ _id: sagaResult._insertedUser._id });
                } catch {}
              }
            },
          },
        ],
      });

      if (!sagaResult.success) {
        // Handle MongoDB E11000 duplicate key error from the unique index
        if (sagaResult.error?.includes("E11000") || sagaResult.error?.includes("duplicate key")) {
          throw new AppError("User already registered", 409);
        }
        throw new AppError("Registration failed. Please try again.", 500);
      }

      const resultPayload = {
        message: "User registered successfully",
        user: sagaResult._insertedUser,
      };

      // Mark as idempotent for retry dedup
      if (idempotencyKey) {
        await markIdempotent(idempotencyKey, resultPayload);
      }

      return jsonSuccess(resultPayload, 201);
    }
  );
