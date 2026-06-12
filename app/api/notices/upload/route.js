import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/rbac";
import { withErrorHandler } from "@/lib/error-handler";
import { AppError } from "@/lib/errors";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

/**
 * POST /api/notices/upload
 *
 * Accepts a single file (multipart/form-data, field name "file").
 * Uploads it to Vercel Blob and returns the public URL.
 * Only teachers, admins, and staff may upload.
 *
 * feat #2184 — Rich media attachments for notices
 */
async function uploadAttachment(request) {
  const allowedRoles = ["teacher", "admin", "staff"];
  await requireRole(request, allowedRoles);

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    throw new AppError("No file provided.", 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError(
      "Invalid file type. Only images and PDFs are allowed.",
      415
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new AppError("File exceeds the 10 MB limit.", 413);
  }

  // Sanitise filename — strip path traversal characters
  const safeName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 128);

  const blob = await put(`notices/${Date.now()}_${safeName}`, file, {
    access: "public",
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}

export const POST = withErrorHandler(uploadAttachment);
