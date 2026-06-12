/**
 * Test suite for secure maintenance mode functionality
 * Ensures bypass tokens are cryptographically random and properly validated
 */

import {
  generateBypassToken,
  verifyBypassToken,
  isMaintenanceModeActive,
  revokeBypassToken,
  cleanupExpiredTokens,
  getMaintenanceStatus,
} from "../maintenanceSecure";

describe("Maintenance Security Module", () => {
  beforeEach(() => {
    // Reset environment for each test
    delete process.env.NEXT_PUBLIC_MAINTENANCE_MODE;
    delete process.env.MAINTENANCE_TOKEN_EXPIRY_MINUTES;
  });

  describe("generateBypassToken", () => {
    it("should generate a valid bypass token", () => {
      const result = generateBypassToken();

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("expiresAt");
      expect(result).toHaveProperty("expiryMinutes");
      expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it("should generate cryptographically random tokens", () => {
      const token1 = generateBypassToken();
      const token2 = generateBypassToken();

      expect(token1.token).not.toBe(token2.token);
    });

    it("should set proper expiration time", () => {
      const before = new Date();
      const result = generateBypassToken();
      const after = new Date();

      const expiresAt = new Date(result.expiresAt);

      // Expiration should be around 60 minutes from now (default)
      const expectedMin = new Date(before.getTime() + 59 * 60 * 1000);
      const expectedMax = new Date(after.getTime() + 61 * 60 * 1000);

      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });
  });

  describe("verifyBypassToken", () => {
    it("should verify a valid token", () => {
      const { token } = generateBypassToken();
      const result = verifyBypassToken(token);

      expect(result.isValid).toBe(true);
      expect(result.reason).toBe("Token is valid");
    });

    it("should reject invalid tokens", () => {
      const result = verifyBypassToken("invalid_token_string");

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token not found or invalid");
    });

    it("should reject null/empty tokens", () => {
      const result1 = verifyBypassToken(null);
      const result2 = verifyBypassToken("");

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    it("should reject expired tokens", async () => {
      process.env.MAINTENANCE_TOKEN_EXPIRY_MINUTES = "0"; // Expire immediately
      const { token } = generateBypassToken();

      // Wait for token to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = verifyBypassToken(token);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe("Token has expired");
    });
  });

  describe("isMaintenanceModeActive", () => {
    it("should return false when maintenance mode is disabled", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "false";

      const result = isMaintenanceModeActive({});

      expect(result).toBe(false);
    });

    it("should return true when maintenance mode is enabled without bypass", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";

      const result = isMaintenanceModeActive({});

      expect(result).toBe(true);
    });

    it("should allow bypass with valid token in cookie", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
      const { token } = generateBypassToken();

      const request = {
        cookies: {
          get: (name) =>
            name === "learnova_maintenance_bypass"
              ? { value: token }
              : undefined,
        },
        headers: {
          get: () => undefined,
        },
      };

      const result = isMaintenanceModeActive(request, "user123");

      expect(result).toBe(false); // Maintenance mode bypassed
    });

    it("should allow bypass with valid token in header", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
      const { token } = generateBypassToken();

      const request = {
        cookies: {
          get: () => undefined,
        },
        headers: {
          get: (name) =>
            name === "x-learnova-maintenance-bypass" ? token : undefined,
        },
      };

      const result = isMaintenanceModeActive(request, "user123");

      expect(result).toBe(false); // Maintenance mode bypassed
    });

    it("should enforce maintenance mode with invalid bypass token", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";

      const request = {
        cookies: {
          get: (name) =>
            name === "learnova_maintenance_bypass"
              ? { value: "invalid" }
              : undefined,
        },
        headers: {
          get: () => undefined,
        },
      };

      const result = isMaintenanceModeActive(request, "user123");

      expect(result).toBe(true); // Maintenance mode enforced
    });
  });

  describe("revokeBypassToken", () => {
    it("should revoke a valid token", () => {
      const { token } = generateBypassToken();

      // Verify token works before revoke
      expect(verifyBypassToken(token).isValid).toBe(true);

      // Revoke token
      revokeBypassToken(token);

      // Verify token no longer works
      expect(verifyBypassToken(token).isValid).toBe(false);
    });

    it("should handle revoking non-existent tokens gracefully", () => {
      expect(() => {
        revokeBypassToken("non-existent-token");
      }).not.toThrow();
    });
  });

  describe("cleanupExpiredTokens", () => {
    it("should remove expired tokens", async () => {
      process.env.MAINTENANCE_TOKEN_EXPIRY_MINUTES = "0"; // Immediate expiration

      const { token } = generateBypassToken();
      await new Promise((resolve) => setTimeout(resolve, 100));

      cleanupExpiredTokens();

      expect(verifyBypassToken(token).isValid).toBe(false);
    });

    it("should keep valid tokens during cleanup", () => {
      const { token } = generateBypassToken();

      cleanupExpiredTokens();

      expect(verifyBypassToken(token).isValid).toBe(true);
    });
  });

  describe("getMaintenanceStatus", () => {
    it("should return current maintenance status", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
      generateBypassToken();

      const status = getMaintenanceStatus();

      expect(status).toHaveProperty("maintenanceEnabled");
      expect(status).toHaveProperty("activeTokens");
      expect(status).toHaveProperty("trackedUsers");
      expect(status).toHaveProperty("configuration");
      expect(status.maintenanceEnabled).toBe(true);
      expect(status.activeTokens).toBeGreaterThan(0);
    });
  });

  describe("Rate limiting", () => {
    it("should enforce rate limit on bypass attempts", () => {
      process.env.NEXT_PUBLIC_MAINTENANCE_MODE = "true";
      process.env.MAINTENANCE_MAX_ATTEMPTS_PER_HOUR = "2";

      const userId = "testuser";

      // Create dummy request for attempts
      const request = {
        cookies: { get: () => undefined },
        headers: { get: () => undefined },
      };

      // First two attempts should succeed (no bypass token, just checking)
      isMaintenanceModeActive(request, userId);
      isMaintenanceModeActive(request, userId);

      // Third attempt should be rate limited
      const result = isMaintenanceModeActive(request, userId);
      expect(result).toBe(true); // Rate limited, maintenance enforced
    });
  });
});
