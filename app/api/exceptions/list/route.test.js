import { GET } from "./route";
import { requireRole } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

// =========================================================================
// FIXED: Prefixed hoisting identifiers with 'mock' to adhere to compiler requirements
// =========================================================================
const mockCursor = {
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
};
const mockCollection = {
  countDocuments: vi.fn().mockResolvedValue(0),
  find: vi.fn(() => mockCursor),
};
const mockDb = {
  collection: vi.fn(() => mockCollection),
};

vi.mock("@/lib/mongodb", () => {
  return {
    connectDb: vi.fn(() => Promise.resolve(mockDb)),
    _mockCollection: mockCollection,
    _mockCursor: mockCursor,
    _mockDb: mockDb,
  };
});

// =========================================================================
// FIXED: Removed runtime require() definitions to prevent unhoisted error drops
// =========================================================================
vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const statusCode = error.statusCode || error.status || 500;
          const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
          return {
            status: statusCode,
            json: async () => ({ error: payload || "Internal server error" }),
          };
        }
      };
    },
  };
});

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("exceptions list route", () => {
  let targetCollection;
  let targetCursor;

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    targetCollection = require("@/lib/mongodb")._mockCollection;
    targetCursor = require("@/lib/mongodb")._mockCursor;
  });

  const createMockRequest = (url = "http://localhost/api/exceptions/list", headers = {}) => {
    const headersMap = new Map(Object.entries({ "x-forwarded-for": "127.0.0.1", ...headers }));
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("filters pending exceptions by student email when requested by a student", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });

    targetCollection.countDocuments.mockResolvedValue(1);
    targetCursor.toArray.mockResolvedValue([
      { reason: "Flu", studentEmail: "student@example.com", status: "pending" },
    ]);

    const response = await GET(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.data.exceptions.length).toBe(1);

    expect(targetCollection.find).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "pending",
        studentEmail: "student@example.com",
      })
    );
  });

  test("does not restrict exceptions by email when requested by admin/teacher", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-123", email: "admin@example.com" },
      profile: { role: "admin" },
    });

    targetCollection.countDocuments.mockResolvedValue(2);
    targetCursor.toArray.mockResolvedValue([
      { reason: "Flu", studentEmail: "student@example.com", status: "pending" },
      { reason: "Trip", studentEmail: "other@example.com", status: "pending" },
    ]);

    const response = await GET(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.data.exceptions.length).toBe(2);

    expect(targetCollection.find).toHaveBeenCalledWith({
      status: "pending",
    });
  });

  test("rejects request with 400 Validation Error on invalid pagination parameters", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });

    const response = await GET(createMockRequest("http://localhost/api/exceptions/list?page=invalid"));
    await assertApiError(response, 400, "Invalid pagination parameters");
  });

  test("rejects request with 401 Unauthorized if token is missing or invalid", async () => {
    const mockAuthError = new Error("Unauthorized");
    mockAuthError.statusCode = 401;
    requireRole.mockRejectedValue(mockAuthError);

    const response = await GET(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 403 Forbidden if role is not allowed", async () => {
    const mockForbiddenError = new Error("Forbidden");
    mockForbiddenError.statusCode = 403;
    requireRole.mockRejectedValue(mockForbiddenError);

    const response = await GET(createMockRequest());
    await assertApiError(response, 403, "Forbidden");
  });

  test("rejects request with 429 if rate limit is exceeded", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await GET(createMockRequest());
    await assertApiError(response, 429, "Too many attempts. Please try again later.");
  });
});