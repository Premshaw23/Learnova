import { POST, normalizeConfidenceScore } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

jest.mock("@/lib/rbac", () => ({
  requireAuth: jest.fn(),
}));

jest.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: jest.fn(),
  getUserProfile: jest.fn(),
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

jest.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
  parseJSON: jest.fn(),
}));

describe("attendance sync route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

    const response = await POST({});

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      syncedIds: [1],
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

    const response = await POST({});

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "User profile not found for attendance sync.",
    });
    expect(runTransaction).not.toHaveBeenCalled();
  });

  test("normalizes confidence scores into the valid range", () => {
    expect(normalizeConfidenceScore(-2)).toBe(0);
    expect(normalizeConfidenceScore(0.42)).toBe(0.42);
    expect(normalizeConfidenceScore(75)).toBe(0.75);
    expect(normalizeConfidenceScore(150)).toBe(1);
    expect(normalizeConfidenceScore(Number.NaN)).toBe(0);
  });
});
