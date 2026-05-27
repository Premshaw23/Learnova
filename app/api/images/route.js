import { NextResponse } from "next/server";
import { connectDb } from "@/lib/mongodb";
import { requireAuth, requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError, ValidationError, NotFoundError } from "@/lib/errors";
import {
    getImageExtensionFromMime,
    normalizeImageMimeType,
    validateImageMagicBytes,
} from "@/lib/avatar-validation";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { z } from "zod";

export const dynamic = "force-dynamic";

const getImageSchema = z.object({
    id: z.string().min(1, "Missing user id parameter"),
});

export const GET = withErrorHandler(async(request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const validation = getImageSchema.safeParse({ id });
    if (!validation.success) {
        const firstError =
            validation.error.issues?.[0]?.message || "Invalid request parameter";
        throw new ValidationError(firstError);
    }

    const decodedToken = await requireAuth(request);

    const db = await connectDb();
    const users = db.collection("users");

    const { ObjectId } = require("mongodb");
    let query = {};
    if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
    } else {
        query = { firebaseUid: id };
    }

    const user = await users.findOne(query, {
        projection: { image: 1, firebaseUid: 1 },
    });

    let imageUrl = user?.image;
    let ownerUid = user?.firebaseUid || (ObjectId.isValid(id) ? null : id);

    if (!imageUrl && ownerUid) {
        const { getUserProfile } = require("@/lib/firebase-admin");
        try {
            const profile = await getUserProfile(ownerUid);
            if (profile) {
                imageUrl = profile.avatar || profile.photoURL || profile.image;
            }
        } catch (err) {
            console.warn("Failed to fetch user profile from Firestore:", err);
        }
    }

    if (!imageUrl) {
        throw new NotFoundError("Image not found");
    }

    if (ownerUid && ownerUid !== decodedToken.uid) {
        try {
            await requireRole(request, ["admin", "institute"]);
        } catch {
            throw new AppError(
                "Forbidden: insufficient permissions to access requested image",
                403
            );
        }
    } else if (!ownerUid) {
        try {
            await requireRole(request, ["admin", "institute"]);
        } catch {
            throw new AppError(
                "Forbidden: insufficient permissions to access requested image",
                403
            );
        }
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(imageUrl);
    } catch {
        throw new ValidationError("Invalid image URL");
    }

    if (parsedUrl.protocol !== "https:") {
        throw new ValidationError("Image URL must use HTTPS");
    }

    const allowedImageHosts = [
        "public.blob.vercel-storage.com",
        "private.blob.vercel-storage.com",
        "lh3.googleusercontent.com",
    ];

    const hostOk = allowedImageHosts.some(
        (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith("." + h)
    );

    if (!hostOk) {
        throw new ValidationError("Image source not allowed");
    }

    const controller = new AbortController();
    const IMAGE_FETCH_TIMEOUT_MS = 10000;
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

    const headers = {};
    if (parsedUrl.hostname.endsWith("private.blob.vercel-storage.com")) {
        headers.Authorization = `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`;
    }

    const startTime = Date.now();
    let imageResponse;
    try {
        imageResponse = await fetch(imageUrl, {
            signal: controller.signal,
            headers,
        });
    } finally {
        clearTimeout(timeoutId);
    }

    const elapsed = Date.now() - startTime;
    if (elapsed > 2000) {
        console.warn(`[Slow Image Fetch] ${elapsed}ms for ${imageUrl}`);
    }

    if (!imageResponse.ok) {
        throw new AppError("Failed to fetch image", 502);
    }

    const contentType = imageResponse.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
        throw new AppError("Response is not an image", 502);
    }

    const contentLength = parseInt(
        imageResponse.headers.get("content-length") || "0",
        10
    );
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    if (contentLength > MAX_IMAGE_SIZE) {
        throw new AppError("Image too large", 413);
    }

    return new NextResponse(imageResponse.body, {
        status: 200,
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "X-Content-Type-Options": "nosniff",
        },
    });
});

export const POST = withErrorHandler(async(request) => {
    const decodedToken = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get("file");

    const rawFaceDescriptor = formData.get("faceDescriptor");
    let faceDescriptor = null;
    if (rawFaceDescriptor) {
        if (
            typeof rawFaceDescriptor !== "string" ||
            rawFaceDescriptor.length > 20000
        ) {
            throw new ValidationError("Face descriptor payload too large");
        }
        try {
            const parsed = JSON.parse(rawFaceDescriptor);
            const faceDescriptorSchema = z.array(z.number()).length(128);
            faceDescriptor = faceDescriptorSchema.parse(parsed);
        } catch {
            throw new ValidationError("Invalid face descriptor format");
        }
    }

    if (!file || typeof file === "string" || !file.type) {
        throw new ValidationError("File is required and must be a valid file");
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const ALLOWED_IMAGE_TYPES = new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ]);

    if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError("File size exceeds 5MB limit");
    }

    const normalizedType = normalizeImageMimeType(file.type);
    if (!ALLOWED_IMAGE_TYPES.has(file.type) &&
        !ALLOWED_IMAGE_TYPES.has(normalizedType)
    ) {
        throw new ValidationError(
            "Invalid image type. Allowed: JPG, JPEG, PNG, WEBP"
        );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
        throw new ValidationError("Uploaded file is empty");
    }

    if (!validateImageMagicBytes(buffer, normalizedType)) {
        const isJpegFamily =
            normalizedType === "image/jpeg" &&
            buffer.length >= 3 &&
            buffer[0] === 0xff &&
            buffer[1] === 0xd8;

        if (!isJpegFamily) {
            throw new ValidationError(
                "File content does not match the declared image type"
            );
        }
    }

    const fileExtension = getImageExtensionFromMime(normalizedType);
    const fileName = `avatars/${decodedToken.uid}-${randomUUID()}.${fileExtension}`;
    const blob = await put(fileName, buffer, {
        contentType: normalizedType,
        access: "private",
    });

    const db = await connectDb();
    const users = db.collection("users");
    const updatePayload = {
        image: blob.url,
        avatarUpdatedAt: new Date(),
    };
    if (faceDescriptor) {
        updatePayload.faceDescriptor = faceDescriptor;
    }

    await users.updateOne({ firebaseUid: decodedToken.uid }, { $set: updatePayload }, { upsert: true });

    try {
        initializeFirebase();
        await admin
            .firestore()
            .collection("users")
            .doc(decodedToken.uid)
            .set({
                avatar: blob.url,
                photoURL: blob.url,
                image: blob.url,
                avatarUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
    } catch (firestoreErr) {
        console.warn("Avatar uploaded but Firestore sync failed:", firestoreErr);
    }

    return NextResponse.json({
        success: true,
        url: blob.url,
        id: decodedToken.uid,
    });
});