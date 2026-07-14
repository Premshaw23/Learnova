import { POST } from "../route";
import { parseJSON } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectDb } from "@/lib/mongodb";
import { emitWebhookEvent } from "@/lib/webhook/dispatcher";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";

vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const payload =
            error.originalMessage !== undefined
              ? error.originalMessage
              : error.message;
          return {
            status: error.statusCode ?? 500,
            json: async () => ({
              error: payload || error.message || "Internal server error",
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

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/gamification-service", () => ({
  awardXp: vi.fn().mockResolvedValue({ xpAwarded: 50, newLevel: null }),
}));

vi.mock("@/lib/dateUtils", () => ({
  getLocalDateKey: vi.fn(() => "2026-05-25"),
}));

vi.mock("@/lib/ssePublisher", () => ({
  publishEvent: vi.fn().mockReturnValue({ catch: vi.fn() }),
}));

vi.mock("@/lib/webhook/dispatcher", () => ({
  emitWebhookEvent: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockDb = {
    collection: vi.fn(() => ({
      updateOne: vi.fn().mockResolvedValue({}),
      deleteOne: vi.fn().mockResolvedValue({}),
    })),
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(() => "server-timestamp"),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("attendance record route — webhook/response gating on saga outcome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Test User",
      email: "test@example.com",
      confidenceScore: 80,
      date: "2026-05-25",
    });
  });

  const createMockRequest = (headers = {}, cookies = {}) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer test",
        ...headers,
      })
    );
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      cookies: {
        get: (key) => cookies[key] || null,
      },
    };
  };

  const setupRequireAuth = async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
  };

  test("fires the webhook and returns alreadyRecorded:false/201 for a genuinely new record", async () => {
    await setupRequireAuth();
    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: vi.fn(() => docRef) };
    const transactionGet = vi.fn().mockResolvedValue({ exists: false });

    getFirestore.mockReturnValue({
      runTransaction: vi.fn(async (callback) =>
        callback({ get: transactionGet, set: vi.fn() })
      ),
      collection: vi.fn(() => collectionRef),
    });

    const response = await POST(createMockRequest());
    const body = await assertApiSuccess(response, 201);

    expect(body.data).toEqual({ alreadyRecorded: false });
    expect(emitWebhookEvent).toHaveBeenCalledTimes(1);
    expect(emitWebhookEvent).toHaveBeenCalledWith(
      "attendance.recorded",
      expect.objectContaining({ studentId: "user-123" })
    );
  });

  test("does NOT fire the webhook and returns alreadyRecorded:true/200 when the saga short-circuits as a duplicate", async () => {
    await setupRequireAuth();
    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: vi.fn(() => docRef) };
    // Document already exists -> write_attendance step sets _alreadyRecorded = true
    const transactionGet = vi.fn().mockResolvedValue({ exists: true });

    getFirestore.mockReturnValue({
      runTransaction: vi.fn(async (callback) =>
        callback({ get: transactionGet, set: vi.fn() })
      ),
      collection: vi.fn(() => collectionRef),
    });

    const response = await POST(createMockRequest());
    const body = await assertApiSuccess(response, 200);

    expect(body.data).toEqual({ alreadyRecorded: true });
    expect(emitWebhookEvent).not.toHaveBeenCalled();
  });
});