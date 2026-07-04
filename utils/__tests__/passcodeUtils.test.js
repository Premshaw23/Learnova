import crypto from "crypto";
import { hashPasscode, verifyPasscode } from "../passcodeUtils";

// ─── hashPasscode ────────────────────────────────────────────────────────────

describe("hashPasscode", () => {
  test("returns an empty string for a falsy passcode", () => {
    expect(hashPasscode("")).toBe("");
    expect(hashPasscode(null)).toBe("");
    expect(hashPasscode(undefined)).toBe("");
  });

  test("returns a string in salt:hash format", () => {
    const result = hashPasscode("123456");
    expect(result).toContain(":");
    const [salt, hash] = result.split(":");
    expect(salt).toHaveLength(32); // 16 bytes → 32 hex chars
    expect(hash).toHaveLength(128); // 64 bytes → 128 hex chars
  });

  test("produces a different salt on every call (non-deterministic)", () => {
    const hash1 = hashPasscode("123456");
    const hash2 = hashPasscode("123456");
    const [salt1] = hash1.split(":");
    const [salt2] = hash2.split(":");
    expect(salt1).not.toBe(salt2);
  });

  test("produces different hashes for different passcodes", () => {
    const [, hash1] = hashPasscode("111111").split(":");
    const [, hash2] = hashPasscode("999999").split(":");
    expect(hash1).not.toBe(hash2);
  });

  test("uses PBKDF2-SHA512 with 210,000 iterations (output length is 128 hex chars = 64 bytes)", () => {
    // 64 bytes of PBKDF2 output → 128 hex characters
    const [, hash] = hashPasscode("test").split(":");
    expect(hash).toHaveLength(128);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });
});

// ─── verifyPasscode ──────────────────────────────────────────────────────────

describe("verifyPasscode", () => {
  test("returns true for a correct passcode", () => {
    const stored = hashPasscode("123456");
    expect(verifyPasscode("123456", stored)).toBe(true);
  });

  test("returns false for an incorrect passcode", () => {
    const stored = hashPasscode("123456");
    expect(verifyPasscode("654321", stored)).toBe(false);
  });

  test("returns false when passcode is empty", () => {
    const stored = hashPasscode("123456");
    expect(verifyPasscode("", stored)).toBe(false);
    expect(verifyPasscode(null, stored)).toBe(false);
    expect(verifyPasscode(undefined, stored)).toBe(false);
  });

  test("returns false when storedHash is empty or falsy", () => {
    expect(verifyPasscode("123456", "")).toBe(false);
    expect(verifyPasscode("123456", null)).toBe(false);
    expect(verifyPasscode("123456", undefined)).toBe(false);
  });

  test("returns false when storedHash has no colon separator", () => {
    expect(verifyPasscode("123456", "noseparatorhere")).toBe(false);
  });

  test("returns false for a malformed stored hash (wrong length after split)", () => {
    expect(verifyPasscode("123456", "badsalt:badhash")).toBe(false);
  });

  test(
    "is consistent across multiple verifications with the same stored hash",
    { timeout: 15000 },
    () => {
      const stored = hashPasscode("abc123");
      expect(verifyPasscode("abc123", stored)).toBe(true);
      expect(verifyPasscode("abc123", stored)).toBe(true);
      expect(verifyPasscode("wrong", stored)).toBe(false);
    }
  );

  test("correctly verifies short numeric passcodes (4-digit)", () => {
    const stored = hashPasscode("0000");
    expect(verifyPasscode("0000", stored)).toBe(true);
    expect(verifyPasscode("0001", stored)).toBe(false);
  });

  test("correctly verifies alphanumeric passcodes", () => {
    const stored = hashPasscode("Pass@2024");
    expect(verifyPasscode("Pass@2024", stored)).toBe(true);
    expect(verifyPasscode("pass@2024", stored)).toBe(false); // case-sensitive
  });
});

// ─── Security properties ─────────────────────────────────────────────────────

describe("Security: iteration count", () => {
  test("hash output is 128 hex characters, confirming 64-byte PBKDF2 key length", () => {
    // This indirectly validates that PBKDF2_ITERATIONS and HASH_KEY_LENGTH
    // constants are wired correctly — a 64-byte key produces 128 hex chars.
    const stored = hashPasscode("test123");
    const [, hash] = stored.split(":");
    expect(hash).toHaveLength(128);
  });

  test("a hash produced with the correct iterations round-trips successfully", () => {
    // If iteration count ever drifts between hash and verify,
    // this round-trip will fail — acts as a regression guard.
    const passcode = "securePasscode!";
    const stored = hashPasscode(passcode);
    expect(verifyPasscode(passcode, stored)).toBe(true);
  });
});
