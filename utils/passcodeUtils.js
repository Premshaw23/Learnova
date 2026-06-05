import crypto from "crypto";

// NIST SP 800-132 (2023) minimum for PBKDF2-HMAC-SHA512
const PBKDF2_ITERATIONS = 210_000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = "sha512";

/**
 * Generates a secure, salted PBKDF2 hash of a passcode.
 * @param {string} passcode - The plain text passcode.
 * @returns {string} The derived salt and hash in the format "salt:hash".
 */
export function hashPasscode(passcode) {
  if (!passcode) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(passcode, salt, PBKDF2_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain text passcode against a stored salt and hash.
 * Uses a timing-safe comparison to prevent timing-based side-channel attacks.
 * @param {string} passcode - The plain text passcode to verify.
 * @param {string} storedHash - The stored string in "salt:hash" format.
 * @returns {boolean} True if the passcode matches the hash, false otherwise.
 */
export function verifyPasscode(passcode, storedHash) {
  if (!passcode || !storedHash || !storedHash.includes(":")) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto
    .pbkdf2Sync(passcode, salt, PBKDF2_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString("hex");

  // Use timing-safe comparison to prevent timing side-channel attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Returns the tenant-scoped document ID for attendance settings.
 * Logs a warning if the instituteId is missing, falling back to uid.
 */
export function getSettingsDocId(profile) {
  if (!profile.instituteId) {
    console.warn(
      `[Attendance Settings] User ${profile.uid} is missing instituteId. Falling back to uid.`
    );
    return profile.uid;
  }
  return profile.instituteId;
}
