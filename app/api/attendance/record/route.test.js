import { POST } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { checkRateLimit } from "@/lib/rateLimit";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";

vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const payload = error.originalMessage !== undefined ? error.originalMessage : error.message;
          return {
            status: error.statusCode ?? 500,
            json: async () => ({ error: payload || error.message || "Internal server error" }),
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

describe("attendance record route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
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

  test("writes attendance to Firestore with canonical doc id + instituteId using transaction", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 75,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: vi.fn(() => docRef) };
    const transactionSet = vi.fn();
    const transactionGet = vi.fn().mockResolvedValue({ exists: false });

    getFirestore.mockReturnValue({
      runTransaction: vi.fn(async (callback) => {
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: vi.fn(() => collectionRef),
    });

    const response = await POST(createMockRequest());

    const body = await assertApiSuccess(response, 201);
    expect(body.data).toEqual({ alreadyRecorded: false });

    expect(collectionRef.doc).toHaveBeenCalledWith("user-123_2026-05-25");
    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).toHaveBeenCalledWith(
      docRef,
      expect.objectContaining({
        userId: "user-123",
        studentName: "Server Name",
        email: "server@example.com",
        instituteId: "inst-999",
        date: "2026-05-25",
        status: "present",
        confidenceScore: 0.75,
        offlineSynced: false,
        timestamp: FieldValue.serverTimestamp.mock.results[0].value,
      }),
      { merge: true },
    );
  });

  test("prevents duplicate check-in if document already exists", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 80,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = {};
    const collectionRef = { doc: vi.fn(() => docRef) };
    const transactionSet = vi.fn();
    const transactionGet = vi.fn().mockResolvedValue({ exists: true });

    getFirestore.mockReturnValue({
      runTransaction: vi.fn(async (callback) => {
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: vi.fn(() => collectionRef),
    });

    const response = await POST(createMockRequest());

    const body = await assertApiSuccess(response, 200);
    expect(body.data).toEqual({ alreadyRecorded: true });

    expect(collectionRef.doc).toHaveBeenCalledWith("user-123_2026-05-25");
    expect(transactionGet).toHaveBeenCalledWith(docRef);
    expect(transactionSet).not.toHaveBeenCalled();
  });

  test("rejects request if unauthorized", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockRejectedValue({
      statusCode: 401,
      message: "Unauthorized",
      originalMessage: "Unauthorized",
    });

    const response = await POST(createMockRequest());
    await assertApiError(response, 401, "Unauthorized");
  });

  test("rejects request with 403 Forbidden if attempting to submit for another user", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "another-user-456",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 80,
      date: "2026-05-25",
    });

    const response = await POST(createMockRequest());
    await assertApiError(response, 403, "Forbidden: Cannot submit attendance for another user");
  });

  test("rejects request with 400 Bad Request if confidence score is invalid or below threshold", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });

    // Scenario 1: below 60
    parseJSON.mockResolvedValue({
      userId: "user-123",
      confidenceScore: 59,
    });
    let response = await POST(createMockRequest());
    await assertApiError(response, 400, "Bad Request: Invalid or spoofed confidence score");

    // Scenario 2: above 100
    parseJSON.mockResolvedValue({
      userId: "user-123",
      confidenceScore: 101,
    });
    response = await POST(createMockRequest());
    await assertApiError(response, 400, "Validation failed");

    // Scenario 3: NaN
    parseJSON.mockResolvedValue({
      userId: "user-123",
      confidenceScore: "not-a-number",
    });
    response = await POST(createMockRequest());
    await assertApiError(response, 400, "Validation failed");
  });

  test("rejects request if rate limit exceeded", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const response = await POST(createMockRequest());
    await assertApiError(response, 429, "Too many attempts. Please try again later.");
  });

  test("simulates concurrent double-click requests and guarantees single write via OCC retry simulation", async () => {
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
    parseJSON.mockResolvedValue({
      userId: "user-123",
      studentName: "Client Name",
      email: "client@example.com",
      confidenceScore: 75,
      date: "2026-05-25",
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const docRef = "user-123_2026-05-25";
    const collectionRef = { doc: vi.fn(() => docRef) };

    const dbStore = new Map();
    const transactionSet = vi.fn();

    const runTransaction = vi.fn(async (callback) => {
      let attempts = 0;
      while (attempts < 5) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 5));

        const get = async (ref) => ({ exists: dbStore.has(ref) });

        let pendingWrite = null;
        const set = (ref, data) => {
          pendingWrite = { ref, data };
        };

        await callback({ get, set });

        if (pendingWrite) {
          if (dbStore.has(pendingWrite.ref)) {
            continue;
          }
          dbStore.set(pendingWrite.ref, pendingWrite.data);
          transactionSet(pendingWrite.ref, pendingWrite.data);
        }
        break;
      }
    });

    getFirestore.mockReturnValue({
      runTransaction,
      collection: vi.fn(() => collectionRef),
    });

    const [response1, response2] = await Promise.all([
      POST(createMockRequest()),
      POST(createMockRequest()),
    ]);

    const statusCodes = [response1.status, response2.status].sort();
    expect(statusCodes).toEqual([200, 201]);

    const resJson1 = await response1.json();
    const resJson2 = await response2.json();

    const results = [resJson1.data.alreadyRecorded, resJson2.data.alreadyRecorded].sort();
    expect(results).toEqual([false, true]);

    expect(dbStore.size).toBe(1);
    expect(dbStore.has(docRef)).toBe(true);
    expect(transactionSet).toHaveBeenCalledTimes(1);
  });
});
