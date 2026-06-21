import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/cleanup/route";

const mockDeleteUser = vi.fn();

vi.mock("firebase-admin", () => ({
  default: {
    auth: () => ({
      deleteUser: mockDeleteUser,
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  initializeFirebase: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/error-handler", async () => {
  const actual = await vi.importActual("@/lib/error-handler");
  return {
    ...actual,
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const status = error.statusCode || 500;
          const message =
            error.originalMessage !== undefined
              ? typeof error.originalMessage === "object"
                ? error.originalMessage.message ||
                  JSON.stringify(error.originalMessage)
                : error.originalMessage
              : error.message;
          return {
            status,
            json: async () => ({
              success: false,
              error: {
                code: `HTTP_${status}`,
                message,
                details: null,
              },
            }),
          };
        }
      };
    },
    parseJSON: vi.fn(),
  };
});

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

describe("POST /api/auth/cleanup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { UnauthorizedError } = await import("@/lib/errors");

    requireAuth.mockRejectedValue(new UnauthorizedError("Unauthorized"));

    const request = {
      headers: {
        get: vi.fn().mockReturnValue(null),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(response.status).toBe(401);
  });

  it("rejects requests where authenticated user tries to delete another user's account", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({ uid: "user-456" });

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(response.status).toBe(403);
  });

  it("allows authenticated user to delete their own orphaned account", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");
    const { initializeFirebase } = await import("@/lib/firebase-admin");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({ uid: "user-123" });
    mockDeleteUser.mockResolvedValue();

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(response.status).toBe(200);
    expect(initializeFirebase).toHaveBeenCalled();
    expect(mockDeleteUser).toHaveBeenCalledWith("user-123");
  });

  it("returns 400 for missing UID", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({});

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it("returns 400 for non-string UID", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({ uid: 12345 });

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it("returns success when user was already deleted", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({ uid: "user-123" });

    const notFoundError = new Error("User not found");
    notFoundError.code = "auth/user-not-found";
    mockDeleteUser.mockRejectedValue(notFoundError);

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(response.status).toBe(200);
  });

  it("returns 500 on unexpected Firebase errors", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    const { parseJSON } = await import("@/lib/error-handler");

    requireAuth.mockResolvedValue({ uid: "user-123", email: "a@test.com" });
    parseJSON.mockResolvedValue({ uid: "user-123" });
    mockDeleteUser.mockRejectedValue(new Error("internal firebase error"));

    const request = {
      headers: {
        get: vi.fn().mockReturnValue("Bearer valid-token"),
      },
    };

    const response = await POST(request);
    const body = await response.json();

    expect(body.success).toBe(false);
    expect(response.status).toBe(500);
  });
});
