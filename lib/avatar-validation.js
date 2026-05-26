const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
};

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

/**
 * Normalizes browser-reported MIME types for avatar uploads.
 * @param {string} mimeType
 * @returns {string}
 */
export function normalizeImageMimeType(mimeType) {
  if (mimeType === "image/jpg") {
    return "image/jpeg";
  }
  return mimeType;
}

/**
 * Validates image buffer magic bytes against the declared MIME type.
 * @param {Buffer|Uint8Array} buffer
 * @param {string} mimeType
 * @returns {boolean}
 */
export function validateImageMagicBytes(buffer, mimeType) {
  const normalized = normalizeImageMimeType(mimeType);
  const magic = MAGIC_BYTES[normalized];

  if (!magic || buffer.length < magic.length) {
    return false;
  }

  for (let i = 0; i < magic.length; i++) {
    if (buffer[i] !== magic[i]) {
      return false;
    }
  }

  if (normalized === "image/webp") {
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
}

export function getImageExtensionFromMime(mimeType) {
  switch (normalizeImageMimeType(mimeType)) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/jpeg":
    default:
      return "jpg";
  }
}
