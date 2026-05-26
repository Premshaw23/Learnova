import crypto from "crypto";

/**
 * Generates a secure, salted PBKDF2 hash of a passcode.
 * @param {string} passcode - The plain text passcode.
 * @returns {string} The derived salt and hash in the format "salt:hash".
 */
export function hashPasscode(passcode) {
  if (!passcode) return "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(passcode, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain text passcode against a stored salt and hash.
 * @param {string} passcode - The plain text passcode to verify.
 * @param {string} storedHash - The stored string in "salt:hash" format.
 * @returns {boolean} True if the passcode matches the hash, false otherwise.
 */
export function verifyPasscode(passcode, storedHash) {
  if (!passcode || !storedHash || !storedHash.includes(":")) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(passcode, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}
