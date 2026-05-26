import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

export const GET = withErrorHandler(async (request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      throw new ValidationError("Missing user id parameter");
    }

    await requireAuth(request);

    const db = await connectDb();
    const users = db.collection("users");

    const { ObjectId } = require("mongodb");
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      throw new ValidationError("Invalid user id");
    }

    const user = await users.findOne(
      { _id: objectId },
      { projection: { image: 1 } }
    );

    if (!user || !user.image) {
      throw new NotFoundError("Image not found");
    }

    const imageResponse = await fetch(user.image);
    if (!imageResponse.ok) {
      throw new AppError("Failed to fetch image", 502);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
});

export const POST = withErrorHandler(async (request) => {
    const decodedToken = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !file.type) {
      throw new ValidationError("File is required and must be a valid file");
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

    if (file.size > MAX_FILE_SIZE) {
      throw new ValidationError("File size exceeds 5MB limit");
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new ValidationError("Invalid image type");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const fileExtension = file.type.split("/")[1] || "jpg";
    const fileName = `avatars/${decodedToken.uid}-${randomUUID()}.${fileExtension}`;
    const blob = await put(fileName, buffer, {
      contentType: file.type,
      access: "public",
    });

    // Update in MongoDB if exists
    const db = await connectDb();
    const users = db.collection("users");
    await users.updateOne(
      { firebaseUid: decodedToken.uid },
      { $set: { image: blob.url } }
    );

    return NextResponse.json({ success: true, url: blob.url });
});
