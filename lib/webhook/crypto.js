import { createHmac, randomBytes, createCipheriv, createDecipheriv, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey() {
  const secret = process.env.WEBHOOK_ENCRYPTION_KEY || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("WEBHOOK_ENCRYPTION_KEY or CRON_SECRET must be set");
  }
  return scryptSync(secret, "webhook-salt", KEY_LENGTH);
}

export function encryptSecret(plaintext) {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptSecret(encryptedValue) {
  const key = getEncryptionKey();
  const parts = encryptedValue.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function hashSecret(secret) {
  const pepper = process.env.WEBHOOK_SECRET_PEPPER || process.env.CRON_SECRET || "default-pepper";
  return createHmac("sha256", pepper).update(secret).digest("hex");
}

export function verifySecretHash(secret, hash) {
  const computed = hashSecret(secret);
  if (computed.length !== hash.length) return false;

  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}
