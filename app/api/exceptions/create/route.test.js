import { POST } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { requireStudent } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/rbac", () => ({
  requireStudent: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

// =========================================================================
// FIXED: Prefixed hoisting identifiers with 'mock' to adhere to compiler requirements
// =========================================================================
const mockCollection = {
  insertOne: vi.fn(),
};
const mockDb = {
  collection: vi.fn(() => mockCollection),
};

vi.mock("@/lib/mongodb", () => {
  return {
    connectDb: vi.fn(() => Promise.resolve(mockDb)),
    _mockCollection: mockCollection,
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
    parseJSON: vi.fn(),
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

describe("exceptions create route", () => {
  let targetCollection;

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    targetCollection = require("@/lib/mongodb")._mockCollection;
  });

  const createMockRequest = (headers = {}) => {
    const headersMap = new Map(Object.entries({ "x-forwarded-for": "127.0.0.1", ...headers }));
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("successfully creates exception request for valid student inputs", async () => {
    requireStudent.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });

    parseJSON.mockResolvedValue({
      reason: "Sick Leave",
      details: "Feeling unwell, high fever.",
      date: "2026-05-28",
    });

    targetCollection.insertOne.mockResolvedValue({ insertedId: "exception-id-123" });

    const response = await POST(createMockRequest());

    const body = await assertApiSuccess(response, 201);
    expect(body.data).toEqual({
      id: "exception-id-123",
      message: "Exception request created successfully",
    });

    expect(targetCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "Sick Leave",
        details: "Feeling unwell, high fever.",
        date: "2026-05-28",
        studentEmail: "student@example.com",
        status: "pending",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    );
  });

  test("rejects request with 400 Validation Error on invalid/missing input fields", async () => {
    requireStudent.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });

    // Reason missing
    parseJSON.mockResolvedValue({
      details: "Feeling unwell, high fever.",
      date: "2026-05-28",
    });

    let response = await POST(createMockRequest());
    await assertApiError(response, 400, "Reason is required");

    // Details too long
    parseJSON.mockResolvedValue({
      reason: "Sick Leave",
      details: "a".repeat(1001),
      date: "2026-05-28",
    });

    response = await POST(createMockRequest());
    await assertApiError(response, 400, "Details must be under 1000 characters");
  });

  test("rejects request with 401 Unauthorized if token is missing or invalid", async () => {
    const mockAuthError = new Error("Unauthorized");
    mockAuthError.statusCode = 401;
    requireStudent.mockRejectedValue(mockAuthError);

    const response = await POST(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 403 Forbidden if user is not a student", async () => {
    const mockForbiddenError = new Error("Forbidden: Requires student role");
    mockForbiddenError.statusCode = 403;
    requireStudent.mockRejectedValue(mockForbiddenError);

    const response = await POST(createMockRequest());
    await assertApiError(response, 403, "Forbidden: Requires student role");
  });

  test("rejects request with 429 if rate limit is exceeded", async () => {
    requireStudent.mockResolvedValue({
      payload: { uid: "student-123", email: "student@example.com" },
      profile: { role: "student" },
    });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await POST(createMockRequest());
    await assertApiError(response, 429, "Too many attempts. Please try again later.");
  });
});