import { describe, expect, test, afterEach, vi } from "vitest";
import {
  generateCsrfToken,
  getCsrfHeaderValue,
  validateCsrfRequest,
  validateCsrfOriginAndReferer,
  getCsrfCookieOptions,
  ensureClientCsrfToken,
  getClientCsrfToken,
} from "../csrf";

describe("CSRF Helpers", () => {
  describe("generateCsrfToken", () => {
    test("generates a random hexadecimal string of correct length", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).toHaveLength(64); // 32 bytes to hex
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });
  });

  describe("getCsrfCookieOptions", () => {
    test("sets httpOnly to true by default", () => {
      const options = getCsrfCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.sameSite).toBe("lax");
      expect(options.path).toBe("/");
    });
  });

  describe("getClientCsrfToken & ensureClientCsrfToken", () => {
    test("ensureClientCsrfToken fetches from server, parses JSON, and caches in-memory", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ csrfToken: "server-fetched-token-999" }),
      });

      const token = await ensureClientCsrfToken(mockFetch);
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/csrf", expect.any(Object));
      expect(token).toBe("server-fetched-token-999");
      expect(getClientCsrfToken()).toBe("server-fetched-token-999");
    });
  });

  describe("getCsrfHeaderValue", () => {
    test("handles null or undefined headers", () => {
      expect(getCsrfHeaderValue(null)).toBeNull();
      expect(getCsrfHeaderValue(undefined)).toBeNull();
    });

    test("reads from Fetch Headers object case-insensitively", () => {
      const headers1 = new Headers();
      headers1.set("x-csrf-token", "token-a");
      expect(getCsrfHeaderValue(headers1)).toBe("token-a");

      const headers2 = new Headers();
      headers2.set("X-CSRF-Token", "token-b");
      expect(getCsrfHeaderValue(headers2)).toBe("token-b");

      const headers3 = new Headers();
      headers3.set("X-XSRF-TOKEN", "token-c");
      expect(getCsrfHeaderValue(headers3)).toBe("token-c");

      const headers4 = new Headers();
      headers4.set("X-CSRFToken", "token-d");
      expect(getCsrfHeaderValue(headers4)).toBe("token-d");
    });
  });

  describe("validateCsrfRequest", () => {
    const mockCookieStore = (value) => ({
      get: (name) => {
        if (name === "csrfToken") return { value };
        return null;
      },
    });

    test("ignores safe HTTP methods", () => {
      const req = {
        method: "GET",
        headers: new Headers(),
        cookies: mockCookieStore(null),
      };
      expect(() => validateCsrfRequest(req)).not.toThrow();
    });

    test("succeeds with matching cookie and canonical header", () => {
      const req = {
        method: "POST",
        headers: new Headers({ "x-csrf-token": "valid-token" }),
        cookies: mockCookieStore("valid-token"),
      };
      expect(() => validateCsrfRequest(req)).not.toThrow();
    });

    test("normalizes tokens with quoting and whitespaces", () => {
      const req = {
        method: "POST",
        headers: new Headers({ "x-csrf-token": ' "valid-token" ' }),
        cookies: mockCookieStore("valid-token"),
      };
      expect(() => validateCsrfRequest(req)).not.toThrow();
    });

    test("throws when CSRF cookie is missing", () => {
      const req = {
        method: "POST",
        headers: new Headers({ "x-csrf-token": "valid-token" }),
        cookies: mockCookieStore(null),
      };
      expect(() => validateCsrfRequest(req)).toThrow("Forbidden: missing CSRF cookie");
    });

    test("throws when CSRF header is missing", () => {
      const req = {
        method: "POST",
        headers: new Headers(),
        cookies: mockCookieStore("valid-token"),
      };
      expect(() => validateCsrfRequest(req)).toThrow("Forbidden: missing CSRF header (x-csrf-token)");
    });

    test("throws when tokens mismatch", () => {
      const req = {
        method: "POST",
        headers: new Headers({ "x-csrf-token": "token-xyz" }),
        cookies: mockCookieStore("token-abc"),
      };
      expect(() => validateCsrfRequest(req)).toThrow("Forbidden: invalid CSRF token (mismatch)");
    });
  });

  describe("validateCsrfOriginAndReferer", () => {
    const originalEnv = process.env.CSRF_TRUSTED_ORIGIN;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.CSRF_TRUSTED_ORIGIN;
      } else {
        process.env.CSRF_TRUSTED_ORIGIN = originalEnv;
      }
    });

    test("skips for safe methods", () => {
      const req = { method: "GET" };
      expect(() => validateCsrfOriginAndReferer(req)).not.toThrow();
    });

    test("succeeds when request.nextUrl.origin matches origin header", () => {
      const req = {
        method: "POST",
        nextUrl: { origin: "https://example.com" },
        headers: new Headers({ origin: "https://example.com" }),
      };
      expect(() => validateCsrfOriginAndReferer(req)).not.toThrow();
    });

    test("fails when origin header does not match", () => {
      const req = {
        method: "POST",
        nextUrl: { origin: "https://example.com" },
        headers: new Headers({ origin: "https://malicious.com" }),
      };
      expect(() => validateCsrfOriginAndReferer(req)).toThrow("Forbidden: invalid Origin/Referer");
    });
  });
});
