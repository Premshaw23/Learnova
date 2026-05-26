import { normalizeImageMimeType } from "@/lib/avatar-validation";

export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const AVATAR_ACCEPT_ATTRIBUTE =
  "image/jpeg,image/jpg,image/png,image/webp";

const PRIVATE_BLOB_HOST = "private.blob.vercel-storage.com";

/**
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isPrivateBlobUrl(url) {
  return typeof url === "string" && url.includes(PRIVATE_BLOB_HOST);
}

/**
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function isValidAvatarUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:image/")) {
    return true;
  }

  if (trimmed.startsWith("/api/images")) {
    return true;
  }

  if (trimmed.startsWith("/")) {
    return trimmed.length > 1;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * @param {{ user?: { uid?: string, photoURL?: string }|null, userProfile?: Record<string, unknown>|null, overrideUrl?: string|null }} params
 * @returns {string|null}
 */
export function pickRawAvatarUrl({ user, userProfile, overrideUrl } = {}) {
  if (overrideUrl && isValidAvatarUrl(overrideUrl)) {
    return overrideUrl;
  }

  const candidates = [
    userProfile?.avatar,
    userProfile?.photoURL,
    userProfile?.image,
    user?.photoURL,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

/**
 * Resolves a displayable avatar URL, proxying private blobs through the API.
 * @param {{ user?: { uid?: string, photoURL?: string }|null, userProfile?: Record<string, unknown>|null, overrideUrl?: string|null, cacheBust?: string|number|null }} params
 * @returns {string|null}
 */
export function resolveAvatarUrl({
  user,
  userProfile,
  overrideUrl,
  cacheBust,
} = {}) {
  const raw = pickRawAvatarUrl({ user, userProfile, overrideUrl });
  if (!raw) {
    return null;
  }

  if (isPrivateBlobUrl(raw) && user?.uid) {
    const base = `/api/images?id=${encodeURIComponent(user.uid)}`;
    if (cacheBust != null && cacheBust !== "") {
      return `${base}&v=${encodeURIComponent(String(cacheBust))}`;
    }
    return base;
  }

  return raw;
}

/**
 * Whether the URL must be fetched with credentials / bearer token.
 * @param {string|null|undefined} url
 * @returns {boolean}
 */
export function avatarSrcRequiresAuth(url) {
  return typeof url === "string" && url.startsWith("/api/images");
}

/**
 * @param {File|null|undefined} file
 * @returns {{ valid: boolean, error?: string, normalizedType?: string }}
 */
function inferMimeTypeFromName(name) {
  if (!name || typeof name !== "string") {
    return "";
  }
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export function validateAvatarFile(file) {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const inferredType = inferMimeTypeFromName(file.name);
  const normalizedType = normalizeImageMimeType(file.type || inferredType);

  if (
    !AVATAR_ALLOWED_MIME_TYPES.includes(file.type) &&
    !AVATAR_ALLOWED_MIME_TYPES.includes(normalizedType) &&
    !AVATAR_ALLOWED_MIME_TYPES.includes(inferredType)
  ) {
    return {
      valid: false,
      error: "Please select a valid image (JPG, JPEG, PNG, or WEBP).",
    };
  }

  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return { valid: false, error: "File size exceeds 5MB limit." };
  }

  if (file.size === 0) {
    return { valid: false, error: "The selected file is empty." };
  }

  return { valid: true, normalizedType };
}

/**
 * @param {string|null|undefined} name
 * @returns {string}
 */
export function getUserInitials(name) {
  if (!name || typeof name !== "string") {
    return "U";
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * @param {{ user?: Record<string, unknown>|null, userProfile?: Record<string, unknown>|null, fallback?: string }} params
 * @returns {string}
 */
export function getUserDisplayName({
  user,
  userProfile,
  fallback = "User",
} = {}) {
  const candidates = [
    userProfile?.fullName,
    userProfile?.displayName,
    user?.displayName,
    user?.name,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  if (typeof user?.email === "string" && user.email.includes("@")) {
    return user.email.split("@")[0];
  }

  return fallback;
}

/**
 * Stable cache-bust token from profile avatar metadata.
 * @param {{ userProfile?: Record<string, unknown>|null, user?: { photoURL?: string }|null }} params
 * @returns {string|number|null}
 */
export function getAvatarCacheBust({ userProfile, user, version } = {}) {
  if (version != null && version !== "") {
    return version;
  }

  const stamp = userProfile?.avatarUpdatedAt ?? userProfile?.updatedAt;

  if (stamp == null) {
    return null;
  }

  if (typeof stamp === "object" && typeof stamp.toMillis === "function") {
    return stamp.toMillis();
  }

  if (typeof stamp === "object" && typeof stamp.seconds === "number") {
    return stamp.seconds;
  }

  if (typeof stamp === "number") {
    return stamp;
  }

  return null;
}

/**
 * @param {unknown} data
 * @param {string} [fallback]
 * @returns {string}
 */
export function parseUploadErrorMessage(data, fallback = "Failed to upload image") {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  if (typeof data.error === "string") {
    return data.error;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  return fallback;
}
