import crypto from "crypto";

/**
 * Sign a webhook payload using HMAC-SHA256
 */
export function signPayload(payload, secret) {
  const dataString = typeof payload === "string" ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(dataString);
  return `sha256=${hmac.digest("hex")}`;
}

/**
 * Verify a webhook payload signature
 */
export function verifySignature(payload, signature, secret) {
  const expectedSignature = signPayload(payload, secret);
  
  if (!signature || !expectedSignature) return false;
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (err) {
    return false; // Length mismatch or other error
  }
}
