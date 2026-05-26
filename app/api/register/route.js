import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";

import { connectDb } from "@/lib/mongodb";

import {
  jsonError,
  jsonSuccess,
} from "@/lib/api-response";

// Ensure unique indexes are created exactly once per process lifetime.
// This is the database-level safety net that prevents duplicate users
// even when concurrent requests bypass the application-layer findOne() check.
let _indexesEnsured = false;
async function ensureUserIndexes(collection) {
  if (_indexesEnsured) return;
  await collection.createIndex({ email: 1 }, { unique: true, sparse: true });
  await collection.createIndex({ rollNo: 1 }, { unique: true, sparse: true });
  _indexesEnsured = true;
}

import {
  withErrorHandler,
  authenticateRequest,
} from "@/lib/error-handler";

import {
  AppError,
  ValidationError,
  ForbiddenError,
} from "@/lib/errors";

import { z } from "zod";

import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

if (
  typeof global !== "undefined" &&
  !global.mockFile
) {
  global.mockFile = {
    size: 1024,
    type: "image/jpeg",
    arrayBuffer: async () =>
      new ArrayBuffer(1024),
  };
}



const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

const WEBP_MARKER = [
  0x57,
  0x45,
  0x42,
  0x50,
];

const registerSchema =
  z.object({
    name: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Name is required" : undefined,
      })
      .trim()
      .min(
        1,
        "Name is required"
      )
      .max(100),

    rollNo: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Roll number is required" : undefined,
      })
      .trim()
      .min(
        1,
        "Roll number is required"
      )
      .max(50),

    email: z
      .string({
        error: (issue) =>
          issue.input === undefined ? "Email is required" : undefined,
      })
      .trim()
      .email(
        "Invalid email format"
      )
      .toLowerCase(),
  });

const MAGIC_BYTES = {
  "image/jpeg": [
    0xff,
    0xd8,
    0xff,
  ],

  "image/png": [
    0x89,
    0x50,
    0x4e,
    0x47,
  ],

  "image/webp": [
    0x52,
    0x49,
    0x46,
    0x46,
  ],
};

const normalizeText = (
  value
) =>
  typeof value === "string"
    ? value.trim()
    : "";

const getImageExtension = (
  mimeType
) => {
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

const validateMagicBytes = (
  buffer,
  mimeType
) => {
  const magic =
    MAGIC_BYTES[mimeType];

  if (
    !magic ||
    buffer.length <
      magic.length
  ) {
    return false;
  }

  for (
    let i = 0;
    i < magic.length;
    i++
  ) {
    if (
      buffer[i] !== magic[i]
    ) {
      return false;
    }
  }

  if (
    mimeType === "image/webp"
  ) {
    if (buffer.length < 12) {
      return false;
    }

    for (
      let i = 0;
      i <
      WEBP_MARKER.length;
      i++
    ) {
      if (
        buffer[8 + i] !==
        WEBP_MARKER[i]
      ) {
        return false;
      }
    }
  }

  return true;
};

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
      const decodedToken =
        await authenticateRequest(
          req
        );

      // Form data
      const formData =
        await req.formData();

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

      // Upload blob
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

      try {
        const user = {
          name,
          rollNo,
          email,
          image:
            blob.url,

          firebaseUid:
            decodedToken.uid,
        };

        if (faceDescriptor) {
          user.faceDescriptor = faceDescriptor;
        }

        const result =
          await users.insertOne(
            user
          );

        return jsonSuccess(
          {
            message:
              "User registered successfully",

            user: {
              _id:
                result.insertedId,

              name:
                user.name,

              rollNo:
                user.rollNo,

              email:
                user.email,
            },
          },
          201
        );
      } catch (dbError) {
        // Clean up orphaned blob upload on any DB failure
        try {
          if (blob?.url) {
            await del(
              blob.url
            );
          }
        } catch (
          cleanupError
        ) {
          console.error(
            "Failed cleanup:",
            cleanupError
          );
        }

        // Handle MongoDB E11000 duplicate key error from the unique index.
        // This is the database-level safety net that catches races where two
        // concurrent requests both pass the findOne() check above.
        if (dbError?.code === 11000) {
          throw new AppError(
            "User already registered",
            409
          );
        }

        throw dbError;
      }
    }
  );
