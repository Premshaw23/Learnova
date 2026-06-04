import crypto from "crypto";

// Encryption algorithm: AES-256-GCM for authenticated encryption
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Generate encryption key from user ID and app secret
 * CRITICAL: Same input always produces same key for decryption
 */
function deriveKey(userId, appSecret) {
  return crypto
    .createHash("sha256")
    .update(`${appSecret}:${userId}`)
    .digest();
}

/**
 * Encrypt sensitive progress data
 * Uses AES-256-GCM for authenticated encryption
 */
export function encryptProgressData(data, userId, appSecret) {
  if (!data || !userId || !appSecret) {
    throw new Error("Missing required encryption parameters");
  }

  const key = deriveKey(userId, appSecret);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Serialize data
  const plaintext = JSON.stringify(data);

  // Encrypt
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Return IV + authTag + encrypted as one string
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt sensitive progress data
 * Verifies authentication tag to detect tampering
 */
export function decryptProgressData(encryptedData, userId, appSecret) {
  if (!encryptedData || !userId || !appSecret) {
    throw new Error("Missing required decryption parameters");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, encrypted] = parts;

  const key = deriveKey(userId, appSecret);
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }

  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid authentication tag");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error("Decryption failed: data may be tampered");
  }
}

/**
 * Server-side progress storage with encryption
 */
export function createProgressStore() {
  return {
    /**
     * Store encrypted progress data
     */
    saveProgress: async (db, userId, progressData, appSecret) => {
      const encrypted = encryptProgressData(progressData, userId, appSecret);

      await db.collection("user_progress").updateOne(
        { userId },
        {
          $set: {
            encryptedData: encrypted,
            dataVersion: 1,
            updatedAt: new Date(),
            // Store hash of original data for integrity verification
            dataHash: crypto
              .createHash("sha256")
              .update(JSON.stringify(progressData))
              .digest("hex"),
          },
        },
        { upsert: true }
      );
    },

    /**
     * Retrieve and decrypt progress data
     */
    loadProgress: async (db, userId, appSecret) => {
      const doc = await db.collection("user_progress").findOne({ userId });

      if (!doc || !doc.encryptedData) {
        return null;
      }

      try {
        const decrypted = decryptProgressData(doc.encryptedData, userId, appSecret);

        // Verify integrity hash
        const hash = crypto
          .createHash("sha256")
          .update(JSON.stringify(decrypted))
          .digest("hex");

        if (hash !== doc.dataHash) {
          console.error(`[SECURITY] Progress data hash mismatch for user ${userId}`);
          throw new Error("Data integrity check failed");
        }

        return decrypted;
      } catch (error) {
        console.error(`[SECURITY] Failed to decrypt progress for user ${userId}:`, error);
        throw error;
      }
    },
  };
}
