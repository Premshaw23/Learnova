import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const getImageSchema = z.object({
  id: z.string().min(1, "Missing user id parameter"),
});

export const GET = withErrorHandler(async (request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const validation = getImageSchema.safeParse({ id });
    if (!validation.success) {
      const firstError = validation.error.issues?.[0]?.message || "Invalid request parameter";
      throw new ValidationError(firstError);
    }

    // Authenticate the requester and capture the decoded token for ownership checks
    const decodedToken = await requireAuth(request);

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
      { projection: { image: 1, firebaseUid: 1 } }
    );

    if (!user || !user.image) {
      throw new NotFoundError("Image not found");
    }

    // Enforce object-level authorization: only the owner or privileged roles may fetch another user's image
    const ownerUid = user.firebaseUid || null;
    if (ownerUid && ownerUid !== decodedToken.uid) {
      try {
        // Allow admins or institute-level users to access other users' images
        await requireRole(request, ["admin", "institute"]);
      } catch (err) {
        throw new AppError("Forbidden: insufficient permissions to access requested image", 403);
      }
    } else if (!ownerUid && ownerUid !== decodedToken.uid) {
      // If there's no firebaseUid on the user doc, be conservative and deny access unless privileged
      try {
        await requireRole(request, ["admin", "institute"]);
      } catch (err) {
        throw new AppError("Forbidden: insufficient permissions to access requested image", 403);
      }
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(user.image);
    } catch {
      throw new ValidationError("Invalid image URL");
    }

    if (parsedUrl.protocol !== "https:") {
      throw new ValidationError("Image URL must use HTTPS");
    }

    const allowedImageHosts = [
      "public.blob.vercel-storage.com",
      "lh3.googleusercontent.com",
    ];

    const hostOk = allowedImageHosts.some(
      (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h)
    );

    if (!hostOk) {
      throw new ValidationError("Image source not allowed");
    }

    const imageResponse = await fetch(user.image);
    if (!imageResponse.ok) {
      throw new AppError("Failed to fetch image", 502);
    }

    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      throw new AppError("Response is not an image", 502);
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
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
