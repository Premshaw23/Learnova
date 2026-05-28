import { GET } from "./route";
import { requireRole } from "@/lib/rbac";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";

jest.mock("@/lib/rbac", () => ({
  requireRole: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

jest.mock("@/lib/mongodb", () => {
  const mockCursor = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };
  const mockCollection = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn(() => mockCursor),
  };
  const mockDb = {
    collection: jest.fn(() => mockCollection),
  };
  return {
    connectDb: jest.fn(() => Promise.resolve(mockDb)),
    _mockCollection: mockCollection,
    _mockCursor: mockCursor,
    _mockDb: mockDb,
  };
});

jest.mock("@/lib/error-handler", () => {
  const { AppError } = require("@/lib/errors");
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          if (error instanceof AppError) {
            const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
            return {
              status: error.statusCode,
              json: async () => ({ error: payload }),
            };
          }
          return {
            status: 500,
            json: async () => ({ error: error.message || "Internal server error" }),
          };
        }
      };
    },
  };
});

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("exceptions list route", () => {
  let mockCollection;
  let mockCursor;

  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    mockCollection = require("@/lib/mongodb")._mockCollection;
    mockCursor = require("@/lib/mongodb")._mockCursor;
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

    mockCollection.countDocuments.mockResolvedValue(1);
    mockCursor.toArray.mockResolvedValue([
      { reason: "Flu", studentEmail: "student@example.com", status: "pending" },
    ]);

    const response = await GET(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.data.exceptions.length).toBe(1);

    expect(mockCollection.find).toHaveBeenCalledWith(
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

    mockCollection.countDocuments.mockResolvedValue(2);
    mockCursor.toArray.mockResolvedValue([
      { reason: "Flu", studentEmail: "student@example.com", status: "pending" },
      { reason: "Trip", studentEmail: "other@example.com", status: "pending" },
    ]);

    const response = await GET(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.data.exceptions.length).toBe(2);

    expect(mockCollection.find).toHaveBeenCalledWith({
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
    const { UnauthorizedError } = require("@/lib/errors");
    requireRole.mockRejectedValue(new UnauthorizedError("Unauthorized"));

    const response = await GET(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 403 Forbidden if role is not allowed", async () => {
    const { ForbiddenError } = require("@/lib/errors");
    requireRole.mockRejectedValue(new ForbiddenError("Forbidden"));

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
