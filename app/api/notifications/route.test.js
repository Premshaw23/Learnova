import { GET, PATCH } from "./route";
import { parseJSON } from "../../../lib/error-handler";
import { checkRateLimit } from "../../../lib/rateLimit";
import clientPromise from "../../../lib/mongodb";
import { UnauthorizedError } from "../../../lib/errors";
import { assertApiSuccess } from "../../../testUtils/assertApiSuccess";
import { assertApiError } from "../../../testUtils/assertApiError";

vi.mock("../../../lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          if (error && (error.statusCode !== undefined || error.name === "AppError")) {
            const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
            return {
              status: error.statusCode || 500,
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
    parseJSON: vi.fn(),
  };
});

vi.mock("../../../lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("../../../lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

const mockCursor = {
  sort: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  toArray: vi.fn().mockResolvedValue([]),
};
const mockCollection = {
  find: vi.fn(() => mockCursor),
  updateMany: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
};

vi.mock("../../../lib/mongodb", () => {
  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };
  const mockClient = {
    db: vi.fn(() => mockDb),
  };
  return {
    __esModule: true,
    default: Promise.resolve(mockClient),
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

describe("notifications route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
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
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });

      const mockNotifications = [
        { _id: "notif-1", userId: "user-123", message: "Notice posted", read: false },
      ];
      mockCursor.toArray.mockResolvedValue(mockNotifications);

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      const body = await assertApiSuccess(response, 200);
      expect(body.data.notifications).toEqual([
        { _id: "notif-1", userId: "user-123", message: "Notice posted", read: false },
      ]);

      expect(mockCollection.find).toHaveBeenCalledWith({ userId: "user-123" });
      expect(mockCursor.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockCursor.limit).toHaveBeenCalledWith(10);
    });

    test("returns empty list if userId query param is missing", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });

      const response = await GET(createMockRequest("http://localhost/api/notifications"));

      const body = await assertApiSuccess(response, 200);
      expect(body.data.notifications).toEqual([]);
      expect(mockCollection.find).not.toHaveBeenCalled();
    });

    test("rejects request with 403 Forbidden if trying to get notifications of another user", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=other-user-456"));

      await assertApiError(response, 403, "Forbidden: You can only access your own notifications");
    });

    test("rejects request with 401 Unauthorized if token is missing or invalid", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockRejectedValue(new UnauthorizedError("Unauthorized"));

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      await assertApiError(response, 401, "Unauthorized");
    });

    test("rejects request with 429 if rate limit is exceeded", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });
      checkRateLimit.mockResolvedValue({ allowed: false });

      const response = await GET(createMockRequest("http://localhost/api/notifications?userId=user-123"));

      await assertApiError(response, 429, "Too many requests. Please slow down.");
    });
  });

  describe("PATCH notifications (mark read)", () => {
    test("successfully marks all notifications as read for own account", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });
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
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });
      parseJSON.mockResolvedValue({});

      const response = await PATCH(createMockRequest());

      await assertApiError(response, 400, "userId is required");
      expect(mockCollection.updateMany).not.toHaveBeenCalled();
    });

    test("rejects request with 403 Forbidden if trying to mark read for another user", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockResolvedValue({ uid: "user-123" });
      parseJSON.mockResolvedValue({ userId: "other-user-456" });

      const response = await PATCH(createMockRequest());

      await assertApiError(response, 403, "Forbidden: You can only modify your own notifications");
    });

    test("rejects request with 401 if unauthorized", async () => {
      const { requireAuth } = await import("../../../lib/rbac");
      requireAuth.mockRejectedValue(new UnauthorizedError("Unauthorized"));

      const response = await PATCH(createMockRequest());
      await assertApiError(response, 401, "Unauthorized");
    });
  });
});
