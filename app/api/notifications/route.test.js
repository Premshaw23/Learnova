import { GET, PATCH } from "./route";
import { authenticateRequest, parseJSON } from "@/lib/error-handler";
import { checkRateLimit } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";

jest.mock("@/lib/error-handler", () => {
  const { AppError } = require("@/lib/errors");
  return {
    authenticateRequest: jest.fn(),
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
    parseJSON: jest.fn(),
  };
});

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

jest.mock("@/lib/mongodb", () => {
  const mockCursor = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    toArray: jest.fn().mockResolvedValue([]),
  };
  const mockCollection = {
    find: jest.fn(() => mockCursor),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
  const mockDb = {
    collection: jest.fn(() => mockCollection),
  };
  const mockClient = {
    db: jest.fn(() => mockDb),
  };
  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
    _mockCollection: mockCollection,
    _mockCursor: mockCursor,
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

describe("notifications route", () => {
  let mockCollection;
  let mockCursor;

  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    mockCollection = require("@/lib/mongodb")._mockCollection;
    mockCursor = require("@/lib/mongodb")._mockCursor;
  });

  const createMockRequest = (url = "http://localhost/api/notifications", headers = {}) => {
    const headersMap = new Map(Object.entries({ "x-forwarded-for": "127.0.0.1", ...headers }));
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  describe("GET notifications", () => {
    test("successfully retrieves notifications when requested for own account", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });

      const mockNotifications = [
        { _id: "notif-1", userId: "user-123", message: "Notice posted", read: false },
      ];
      mockCursor.toArray.mockResolvedValue(mockNotifications);

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      const body = await assertApiSuccess(response, 200);
      expect(body.notifications).toEqual([
        { _id: "notif-1", userId: "user-123", message: "Notice posted", read: false },
      ]);

      expect(mockCollection.find).toHaveBeenCalledWith({ userId: "user-123" });
      expect(mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockCursor.limit).toHaveBeenCalledWith(10);
    });

    test("returns empty list if userId query param is missing", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });

      const response = await GET(createMockRequest("http://localhost/api/notifications"));

      const body = await assertApiSuccess(response, 200);
      expect(body.notifications).toEqual([]);
      expect(mockCollection.find).not.toHaveBeenCalled();
    });

    test("rejects request with 403 Forbidden if trying to get notifications of another user", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=other-user-456"));

      await assertApiError(response, 403, "Forbidden: You can only access your own notifications");
    });

    test("rejects request with 401 Unauthorized if token is missing or invalid", async () => {
      const { UnauthorizedError } = require("@/lib/errors");
      authenticateRequest.mockRejectedValue(new UnauthorizedError("Unauthorized"));

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      await assertApiError(response, 401, "Unauthorized");
    });

    test("rejects request with 429 if rate limit is exceeded", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });
      checkRateLimit.mockResolvedValue({ allowed: false });

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toBe("Too many requests. Please slow down.");
    });
  });

  describe("PATCH notifications (mark read)", () => {
    test("successfully marks all notifications as read for own account", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });
      parseJSON.mockResolvedValue({ userId: "user-123" });

      const response = await PATCH(createMockRequest());

      const body = await assertApiSuccess(response, 200);
      expect(body.success).toBe(true);

      expect(mockCollection.updateMany).toHaveBeenCalledWith(
        { userId: "user-123", read: false },
        { $set: { read: true } }
      );
    });

    test("returns success false if userId is missing from request body", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });
      parseJSON.mockResolvedValue({});

      const response = await PATCH(createMockRequest());

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(mockCollection.updateMany).not.toHaveBeenCalled();
    });

    test("rejects request with 403 Forbidden if trying to mark read for another user", async () => {
      authenticateRequest.mockResolvedValue({ uid: "user-123" });
      parseJSON.mockResolvedValue({ userId: "other-user-456" });

      const response = await PATCH(createMockRequest());

      await assertApiError(response, 403, "Forbidden: You can only modify your own notifications");
    });

    test("rejects request with 401 if unauthorized", async () => {
      const { UnauthorizedError } = require("@/lib/errors");
      authenticateRequest.mockRejectedValue(new UnauthorizedError("Unauthorized"));

      const response = await PATCH(createMockRequest());
      await assertApiError(response, 401, "Unauthorized");
    });
  });
});
