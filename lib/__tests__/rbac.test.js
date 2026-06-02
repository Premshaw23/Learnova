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

  test("enforces student role on exceptions/create", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "student-1",
      email_verified: true,
      role: "student",
    });
    getUserProfile.mockResolvedValue({ uid: "student-1", role: "student" });

    const result = await requireApiAccess(mockRequest("/api/exceptions/create"));
    expect(result.payload.role).toBe("student");

    authenticateRequest.mockResolvedValue({
      uid: "teacher-1",
      email_verified: true,
      role: "teacher",
    });
    await expect(requireApiAccess(mockRequest("/api/exceptions/create")))
      .rejects.toThrow("Forbidden");
  });

  test("enforces teacher or admin role on exceptions/all", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "teacher-1",
      email_verified: true,
      role: "teacher",
    });
    getUserProfile.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    const result = await requireApiAccess(mockRequest("/api/exceptions/all"));
    expect(result.payload.role).toBe("teacher");

    authenticateRequest.mockResolvedValue({
      uid: "student-1",
      email_verified: true,
      role: "student",
    });
    await expect(requireApiAccess(mockRequest("/api/exceptions/all")))
      .rejects.toThrow("Forbidden");
  });

  test("enforces student, teacher, or admin role on exceptions/list", async () => {
    authenticateRequest.mockResolvedValue({
      uid: "student-1",
      email_verified: true,
      role: "student",
    });
    getUserProfile.mockResolvedValue({ uid: "student-1", role: "student" });

    let result = await requireApiAccess(mockRequest("/api/exceptions/list"));
    expect(result.payload.role).toBe("student");

    authenticateRequest.mockResolvedValue({
      uid: "teacher-1",
      email_verified: true,
      role: "teacher",
    });
    getUserProfile.mockResolvedValue({ uid: "teacher-1", role: "teacher" });

    result = await requireApiAccess(mockRequest("/api/exceptions/list"));
    expect(result.payload.role).toBe("teacher");
  });
});
