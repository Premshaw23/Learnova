import { POST } from "./route";
import { authenticateRequest, parseJSON } from "../../../../lib/error-handler";
import { checkRateLimit } from "../../../../lib/rateLimit";
import { connectDb, _mockCollection } from "../../../../lib/mongodb";
import { assertApiSuccess } from "../../../../testUtils/assertApiSuccess";
import { assertApiError } from "../../../../testUtils/assertApiError";
import { UnauthorizedError } from "../../../../lib/errors";

vi.mock("../../../../lib/error-handler", () => {
  const { AppError } = require("../../../../lib/errors");
  return {
    authenticateRequest: jest.fn(),
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          if (error instanceof AppError || typeof error.statusCode === "number") {
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
    parseJSON: jest.fn(),
  };
});

vi.mock("../../../../lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("../../../../lib/mongodb", () => {
  const mockCollection = {
    insertMany: jest.fn().mockResolvedValue({ acknowledged: true }),
  };
  const mockDb = {
    collection: jest.fn(() => mockCollection),
  };
  return {
    connectDb: jest.fn(() => Promise.resolve(mockDb)),
    _mockCollection: mockCollection,
    _mockDb: mockDb,
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

describe("notifications seed route", () => {
  const mockCollection = _mockCollection;

  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  const createMockRequest = (headers = {}) => {
    const headersMap = new Map(Object.entries({ "x-forwarded-for": "127.0.0.1", ...headers }));
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("successfully seeds notifications for own account", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({ userId: "user-123" });

    const response = await POST(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.success).toBe(true);

    expect(mockCollection.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({ userId: "user-123", type: "attendance" }),
      expect.objectContaining({ userId: "user-123", type: "notice" }),
      expect.objectContaining({ userId: "user-123", type: "alert" }),
    ]);
  });

  test("rejects request with 400 Bad Request if userId is missing from request body", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({});

    const response = await POST(createMockRequest());
    await assertApiError(response, 400, "userId is required");
    expect(mockCollection.insertMany).not.toHaveBeenCalled();
  });

  test("rejects request with 403 Forbidden if trying to seed notifications for another user", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({ userId: "other-user-456" });

    const response = await POST(createMockRequest());
    await assertApiError(response, 403, "Forbidden: You can only seed notifications for your own account");
  });

  test("rejects request with 401 if unauthorized", async () => {
    authenticateRequest.mockRejectedValue(new UnauthorizedError("Unauthorized"));

    const response = await POST(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 429 if rate limit is exceeded", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({ userId: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await POST(createMockRequest());
    await assertApiError(response, 429, "Too many requests. Please slow down.");
  });
});
