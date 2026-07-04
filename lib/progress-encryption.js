/**
 * lib/progress-encryption.js
 *
 * Encryption/decryption utilities for sensitive learning progress data.
 * Encrypts quiz scores, performance metrics, learning patterns to protect
 * student privacy and cognitive profiling information.
 *
 * Uses environment variable: LEARNING_DATA_ENCRYPTION_KEY
 * Must be a 32-byte base64-encoded key.
 */

/**
 * Get or create encryption key from environment.
 * In production, key must be securely managed (e.g., AWS KMS, HashiCorp Vault)
 * @returns {string} Base64-encoded encryption key
 */

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

export function getEncryptionKey() {
  const key = process.env.LEARNING_DATA_ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "LEARNING_DATA_ENCRYPTION_KEY environment variable is not set. " +
        "Please configure encryption key for production data protection."
    );
  }

  // Validate key is properly formatted
  try {
    const buffer = Buffer.from(key, "base64");
    if (buffer.length !== 32) {
      throw new Error(`Encryption key must be 32 bytes, got ${buffer.length}`);
    }
    return key;
  } catch (error) {
    throw new Error(`Invalid encryption key format: ${error.message}`);
  }
}

/**
 * Encrypt sensitive learning progress data.
 * @param {Object} data - Learning data to encrypt (scores, performance, patterns)
 * @returns {string} Base64-encoded encrypted data
 */
export function encryptProgressData(data) {
  try {
    //const crypto = require("crypto");
    const key = Buffer.from(getEncryptionKey(), "base64");

    // Convert data to JSON string
    const jsonStr = JSON.stringify(data);

    // Generate random IV for this encryption
    const iv = randomBytes(16);

    // Create cipher
    const cipher = createCipheriv("aes-256-cbc", key, iv);

    // Encrypt
    let encrypted = cipher.update(jsonStr, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV + encrypted data (IV doesn't need to be secret, just unique)
    const combined = iv.toString("hex") + ":" + encrypted;

    // Return as base64
    return Buffer.from(combined).toString("base64");
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt sensitive learning progress data.
 * @param {string} encryptedData - Base64-encoded encrypted data
 * @returns {Object} Decrypted learning data
 */
export function decryptProgressData(encryptedData) {
  try {
    //const crypto = require("crypto");
    const key = Buffer.from(getEncryptionKey(), "base64");

    // Decode from base64
    const combined = Buffer.from(encryptedData, "base64").toString("utf8");
    const [ivHex, encryptedHex] = combined.split(":");

    if (!ivHex || !encryptedHex) {
      throw new Error("Invalid encrypted data format");
    }

    // Extract IV
    const iv = Buffer.from(ivHex, "hex");

    // Create decipher
    const decipher = createDecipheriv("aes-256-cbc", key, iv);

    // Decrypt
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Parse JSON
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt a field within a document.
 * Useful for selective field encryption.
 * @param {Object} doc - Document containing field to encrypt
 * @param {string} fieldName - Name of field to encrypt
 * @returns {Object} Document with encrypted field
 */
export function encryptDocumentField(doc, fieldName) {
  if (!doc[fieldName]) {
    return doc;
  }

  return {
    ...doc,
    [fieldName]: encryptProgressData(doc[fieldName]),
    [`_encrypted_${fieldName}`]: true, // Flag indicating field is encrypted
  };
}

/**
 * Decrypt a field within a document.
 * @param {Object} doc - Document containing encrypted field
 * @param {string} fieldName - Name of field to decrypt
 * @returns {Object} Document with decrypted field
 */
export function decryptDocumentField(doc, fieldName) {
  const isEncrypted = doc[`_encrypted_${fieldName}`];

  if (!isEncrypted || !doc[fieldName]) {
    return doc;
  }

  return {
    ...doc,
    [fieldName]: decryptProgressData(doc[fieldName]),
    [`_encrypted_${fieldName}`]: false,
  };
}

/**
 * Encrypt multiple fields in a document.
 * @param {Object} doc - Document to encrypt
 * @param {Array<string>} fieldNames - Field names to encrypt
 * @returns {Object} Document with encrypted fields
 */
export function encryptDocumentFields(doc, fieldNames) {
  let result = { ...doc };

  for (const fieldName of fieldNames) {
    result = encryptDocumentField(result, fieldName);
  }

  return result;
}

/**
 * Decrypt multiple fields in a document.
 * @param {Object} doc - Document to decrypt
 * @param {Array<string>} fieldNames - Field names to decrypt
 * @returns {Object} Document with decrypted fields
 */
export function decryptDocumentFields(doc, fieldNames) {
  let result = { ...doc };

  for (const fieldName of fieldNames) {
    result = decryptDocumentField(result, fieldName);
  }

  return result;
}

/**
 * Validate that encryption key is properly configured.
 * Run during application startup to ensure encryption is ready.
 * @returns {boolean} True if encryption is properly configured
 * @throws {Error} If encryption key is not configured
 */
export function validateEncryptionConfiguration() {
  try {
    getEncryptionKey();
    return true;
  } catch (error) {
    throw new Error(
      `Encryption not configured: ${error.message}. ` +
        "Learning progress data cannot be protected. " +
        "Set LEARNING_DATA_ENCRYPTION_KEY environment variable."
    );
  }
}

/**
 * List of fields that should always be encrypted in progress documents.
 * Add to this list any new sensitive fields.
 */
export const SENSITIVE_PROGRESS_FIELDS = [
  "quiz_scores",
  "performance_metrics",
  "learning_patterns",
  "cognitive_profile",
  "weakness_areas",
  "strength_areas",
  "learning_disabilities",
  "assessment_results",
];
