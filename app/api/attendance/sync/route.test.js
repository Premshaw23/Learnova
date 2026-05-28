import { POST, normalizeConfidenceScore } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";
import { assertApiError } from "@/testUtils/assertApiError";
import { checkRateLimit } from "@/lib/rateLimit";

jest.mock("@/lib/rbac", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

jest.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: jest.fn(),
  getUserProfile: jest.fn(),
}));

jest.mock("@/lib/gamification-service", () => ({
  awardXp: jest.fn().mockResolvedValue({ xpAwarded: 50, newLevel: null }),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
  FieldValue: {
    serverTimestamp: jest.fn(() => "server-timestamp"),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

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
    parseJSON: jest.fn(),
  };
});

describe("attendance sync route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  const createMockRequest = (headers = {}, body = {}) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        ...headers,
      })
    );
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("uses server profile data instead of client-supplied attendance identity", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "auth@example.com",
      name: "Auth Name",
    });

    parseJSON.mockResolvedValue({
      records: [
        {
          id: 1,
          userId: "user-123",
          studentName: "Tampered Name",
          email: "tampered@example.com",
          confidenceScore: 85,
          queuedAt: Date.now(),
        },
      ],
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
    });

    let transactionGet;
    let transactionSet;

    const docRef = {};

    const collectionRef = {
      doc: jest.fn(() => docRef),
    };

    getFirestore.mockReturnValue({
      runTransaction: jest.fn(async (callback) => {
        transactionSet = jest.fn();
        transactionGet = jest.fn().mockResolvedValue({ exists: false });
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    });

    const body = await assertApiSuccess(response, 200);
    expect(body).toEqual({
      success: true,
      syncedIds: [1],
      rejectedIds: [],
    });

    expect(getUserProfile).toHaveBeenCalledWith("user-123");
    expect(collectionRef.doc).toHaveBeenCalledWith(expect.stringMatching(/^user-123_\d{4}-\d{2}-\d{2}$/));
    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionSet).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: "user-123",
        studentName: "Server Name",
        email: "server@example.com",
        confidenceScore: 0.85,
        timestamp: FieldValue.serverTimestamp.mock.results[0].value,
        offlineSynced: true,
      }),
    );
  });

  test("rejects sync when the server profile is missing", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "auth@example.com",
      name: "Auth Name",
    });

    parseJSON.mockResolvedValue({
      records: [
        {
          id: 2,
          userId: "user-123",
          studentName: "Tampered Name",
          email: "tampered@example.com",
          confidenceScore: 0.5,
          queuedAt: Date.now(),
        },
      ],
    });

    getUserProfile.mockResolvedValue(null);

    const collectionRef = {
      doc: jest.fn(() => ({ get: jest.fn() })),
    };

    const runTransaction = jest.fn();

    getFirestore.mockReturnValue({
      runTransaction,
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    });

    await assertApiError(response, 404, "User profile not found for attendance sync.");
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("rejects record and unsets from queue when userId mismatches or confidence is too low", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "auth@example.com",
      name: "Auth Name",
    });

    parseJSON.mockResolvedValue({
      records: [
        {
          id: 10,
          userId: "other-user-456", // Mismatched userId
          confidenceScore: 0.85,
          queuedAt: Date.now(),
        },
        {
          id: 11,
          userId: "user-123",
          confidenceScore: 0.15, // Too low confidence score
          queuedAt: Date.now(),
        },
      ],
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
    });

    getFirestore.mockReturnValue({
      runTransaction: jest.fn(),
      collection: jest.fn(),
    });

    const response = await POST({
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      syncedIds: [],
      rejectedIds: [10, 11],
      warning: "Some records were not synced because they exceeded the 48-hour offline window. These records have been removed from your local queue.",
    });
  });

  test("acknowledges duplicate records without awarding XP when attendance already exists in Firestore", async () => {
    requireAuth.mockResolvedValue({
      uid: "user-123",
      email: "auth@example.com",
    });

    parseJSON.mockResolvedValue({
      records: [
        {
          id: 5,
          userId: "user-123",
          confidenceScore: 85,
          queuedAt: Date.now(),
        },
      ],
    });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
    });

    let transactionGet;
    let transactionSet;

    const docRef = {};
    const collectionRef = {
      doc: jest.fn(() => docRef),
    };

    getFirestore.mockReturnValue({
      runTransaction: jest.fn(async (callback) => {
        transactionGet = jest.fn().mockResolvedValue({ exists: true });
        transactionSet = jest.fn();
        return callback({ get: transactionGet, set: transactionSet });
      }),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      syncedIds: [5],
      rejectedIds: [],
    });

    expect(transactionGet).toHaveBeenCalledTimes(1);
    expect(transactionSet).not.toHaveBeenCalled();
  });

  test("normalizes confidence scores into the valid range", () => {
    // Values below the 60% minimum threshold are rejected
    expect(normalizeConfidenceScore(-2)).toBeNull();
    expect(normalizeConfidenceScore(0.42)).toBeNull();
    expect(normalizeConfidenceScore(Number.NaN)).toBeNull();

    // Valid scores above threshold
    expect(normalizeConfidenceScore(75)).toBe(0.75);
    expect(normalizeConfidenceScore(150)).toBe(1);
    expect(normalizeConfidenceScore(0.85)).toBe(0.85);
  });
});
