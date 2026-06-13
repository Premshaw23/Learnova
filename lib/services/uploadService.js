import { put, del } from "@vercel/blob";
import { randomUUID } from "crypto";
import { ValidationError } from "@/lib/errors";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const CERTIFICATE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

const MAGIC_BYTES = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/webp": [
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
  ],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]],
};

function checkMagicBytes(buffer, expectedSignatures) {
  for (const signature of expectedSignatures) {
    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (signature[i] !== null && buffer[i] !== signature[i]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export class StorageService {
  async upload(fileName, buffer, mimeType) {
    throw new Error("Method not implemented.");
  }
  async delete(url) {
    throw new Error("Method not implemented.");
  }
}

export class VercelBlobStorage extends StorageService {
  async upload(fileName, buffer, mimeType) {
    const blob = await put(fileName, buffer, {
      contentType: mimeType,
      access: "public",
    });
    return blob.url;
  }
  async delete(url) {
    await del(url).catch((e) => console.error("Failed to delete blob", e));
  }
}

// Storage adapter singleton
export const activeStorage = new VercelBlobStorage();

/**
 * Validates, secures, and uploads a file to the active storage layer.
 * Enforces Magic Bytes signature verification and MIME types.
 */
export async function processAndUploadFile(file, prefix = "uploads") {
  if (!file || typeof file === "string" || !file.type) {
    throw new ValidationError("Invalid file object");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const mimeType = file.type.split(";")[0].trim().toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ValidationError(
      "Invalid file type. Only JPEG, PNG, and WebP are allowed."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  // 1. File Signature Analysis (Magic Bytes check)
  const expectedSignatures = MAGIC_BYTES[mimeType];
  if (!expectedSignatures || !checkMagicBytes(buffer, expectedSignatures)) {
    throw new ValidationError(
      "File signature does not match expected MIME type (Potential spoofing/malware)."
    );
  }

  // 2. Upload to abstract storage layer
  const extension = mimeType.split("/")[1] || "bin";
  const fileName = `${prefix}/${randomUUID()}.${extension}`;

  const url = await activeStorage.upload(fileName, buffer, mimeType);

  return { url, fileName, mimeType, size: buffer.byteLength };
}

/**
 * Validates and uploads certificate files (PDF, PNG, JPG).
 */
export async function processAndUploadCertificate(file, prefix = "certificates") {
  if (!file || typeof file === "string" || !file.type) {
    throw new ValidationError("Invalid file object");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const mimeType = file.type.split(";")[0].trim().toLowerCase();
  if (!CERTIFICATE_MIME_TYPES.has(mimeType)) {
    throw new ValidationError(
      "Invalid file type. Only PDF, PNG, and JPG are allowed."
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new ValidationError("File size exceeds 5MB limit");
  }

  const expectedSignatures = MAGIC_BYTES[mimeType];
  if (!expectedSignatures || !checkMagicBytes(buffer, expectedSignatures)) {
    throw new ValidationError(
      "File signature does not match expected MIME type (Potential spoofing/malware)."
    );
  }

  const extension =
    mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1] || "bin";
  const fileName = `${prefix}/${randomUUID()}.${extension}`;

  const url = await activeStorage.upload(fileName, buffer, mimeType);

  return { url, fileName, mimeType, size: buffer.byteLength };
}
