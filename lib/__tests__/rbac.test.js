import { describe, expect, test, beforeEach, vi } from "vitest";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { requireApiAccess, requireAuth, requireRole } from "@/lib/rbac";

vi.mock("@/lib/error-handler", () => ({
  authenticateRequest: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUserProfile: vi.fn(),
}));

function mockRequest(pathname = "/api/test") {
  return {
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
  };
}

describe("rbac helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("rejects invalid tokens", async () => {
    authenticateRequest.mockRejectedValue(new UnauthorizedError("Unauthorized"));

    await expect(requireAuth(mockRequest())).rejects.toBeInstanceOf(UnauthorizedError);
  });

  test("rejects unverified emails by default", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "user-123",
      email_verified: false,
      role: "student",
    });

    await expect(requireAuth(mockRequest())).rejects.toThrow("Email not verified");
  });

  test("rejects the wrong role", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "user-123",
      email_verified: true,
      role: "student",
    });

    await expect(requireRole(mockRequest(), ["admin"]))
      .rejects.toThrow("Requires one of admin");
  });

  test("returns the caller profile for allowed roles", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "user-123",
      email_verified: true,
      role: "admin",
    });
    getUserProfile.mockResolvedValue({ uid: "user-123", role: "admin" });

    const result = await requireRole(mockRequest(), ["admin"]);

    expect(result.payload.uid).toBe("user-123");
    expect(result.profile).toEqual({ uid: "user-123", role: "admin" });
  });

  test("keeps explicit public API routes public", async () => {
    const result = await requireApiAccess(mockRequest("/api/auth/csrf"));

    expect(result).toEqual({ public: true });
    expect(authenticateRequest).not.toHaveBeenCalled();
  });
});
