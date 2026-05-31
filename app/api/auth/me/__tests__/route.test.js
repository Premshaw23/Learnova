import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/auth/me/route";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
  authenticateRequest: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(message, statusCode = 500) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns user info with role from Firestore", async () => {
    const { authenticateRequest } = await import("@/lib/error-handler");
    const { getUserProfile } = await import("@/lib/firebase-admin");

    authenticateRequest.mockResolvedValue({
      uid: "user-123",
      email: "test@example.com",
      email_verified: true,
      role: "student",
    });

    getUserProfile.mockResolvedValue({
      role: "teacher",
      fullName: "Test User",
    });

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("127.0.0.1"),
      },
    };

    const response = await GET(request);
    const body = await response.json();

    expect(body.uid).toBe("user-123");
    expect(body.email).toBe("test@example.com");
    expect(body.role).toBe("teacher"); // Firestore role (authoritative)
    expect(body.jwtRole).toBe("student"); // JWT role (potentially stale)
    expect(body.rolesInSync).toBe(false);
  });

  it("returns rolesInSync: true when roles match", async () => {
    const { authenticateRequest } = await import("@/lib/error-handler");
    const { getUserProfile } = await import("@/lib/firebase-admin");

    authenticateRequest.mockResolvedValue({
      uid: "user-456",
      email: "sync@example.com",
      email_verified: true,
      role: "admin",
    });

    getUserProfile.mockResolvedValue({
      role: "admin",
    });

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("127.0.0.1"),
      },
    };

    const response = await GET(request);
    const body = await response.json();

    expect(body.rolesInSync).toBe(true);
    expect(body.role).toBe("admin");
    expect(body.jwtRole).toBe("admin");
  });

  it("handles missing Firestore profile gracefully", async () => {
    const { authenticateRequest } = await import("@/lib/error-handler");
    const { getUserProfile } = await import("@/lib/firebase-admin");

    authenticateRequest.mockResolvedValue({
      uid: "user-789",
      email: "nofirestore@example.com",
      email_verified: false,
      role: null,
    });

    getUserProfile.mockResolvedValue(null);

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("127.0.0.1"),
      },
    };

    const response = await GET(request);
    const body = await response.json();

    expect(body.role).toBeNull();
    expect(body.jwtRole).toBeNull();
    expect(body.rolesInSync).toBe(true);
  });
});
