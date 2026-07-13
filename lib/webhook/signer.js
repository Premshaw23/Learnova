import { createHmac, timingSafeEqual } from "crypto";

export function signPayload(payload, secret) {
  const hmac = createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest("hex")}`;
}

export function verifyPayload(payload, signature, secret) {
  const expected = signPayload(payload, secret);
  const actual = signature.replace(/^sha256=/, "");
  const expectedDigest = expected.replace(/^sha256=/, "");
  if (expectedDigest.length !== actual.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expectedDigest), Buffer.from(actual));
  } catch {
    return false;
  }
}
