import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectDb } from "@/lib/mongodb";
import { extractImageFileFromFormData, uploadAvatarToBlob } from "@/lib/images/imagesService";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const POST = async (request) => {
  try {
    const decodedToken = await requireAuth(request);

    const ip =
      request.headers.get("x-forwarded-for") || "127.0.0.1";

    const rateLimitResult = await checkRateLimit(
      `avatar_upload_${ip}_${decodedToken.uid}`
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = extractImageFileFromFormData(formData);

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // File metadata received; do not log PII or file details in production

    if (file.size <= 0) {
      return NextResponse.json(
        { error: "File is empty" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob instead of storing base64 in MongoDB
    const { blobUrl } = await uploadAvatarToBlob({
      file,
      uid: decodedToken.uid,
    });

    try {
      const db = await connectDb();
      const usersCollection = db.collection("users");

      // Fetch existing avatar URL to clean up old blob if present
      const existingUser = await usersCollection.findOne(
        { firebaseUid: decodedToken.uid },
        { projection: { avatar: 1 } }
      );

      await usersCollection.updateOne(
        { firebaseUid: decodedToken.uid },
        { $set: { avatar: blobUrl } }
      );

      // Delete old blob after successful DB write
      const oldAvatar = existingUser?.avatar;

      if (
        oldAvatar &&
        oldAvatar.startsWith("https://")
      ) {
        await del(oldAvatar).catch(() => {});
      }
    } catch (error) {
      // Roll back blob upload on DB failure
      await del(blobUrl).catch(() => {});
      throw error;
    }

    // Avatar saved successfully to blob storage

    return NextResponse.json(
      {
        success: true,
        url: blobUrl,
        message: "Avatar uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Avatar upload error:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    // Return specific error messages
    if (
      error.message &&
      error.message.includes("Unauthorized")
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      error.statusCode &&
      error.statusCode < 500
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to upload avatar",
      },
      { status: 500 }
    );
  }
};