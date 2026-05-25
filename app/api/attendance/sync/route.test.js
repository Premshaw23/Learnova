import { POST, normalizeConfidenceScore } from "./route";
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

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
    });

    const batch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    const docRef = {
      get: jest.fn().mockResolvedValue({ exists: false }),
    };

    const collectionRef = {
      doc: jest.fn(() => docRef),
    };

    getFirestore.mockReturnValue({
      batch: jest.fn(() => batch),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      json: async () => ({
        records: [
          {
            id: 1,
            userId: "user-123",
            studentName: "Tampered Name",
            email: "tampered@example.com",
            confidenceScore: 1.7,
            queuedAt: Date.now(),
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      syncedIds: [1],
    });

    expect(getUserProfile).toHaveBeenCalledWith("user-123");
    expect(collectionRef.doc).toHaveBeenCalledWith(expect.stringMatching(/^user-123_\d{4}-\d{2}-\d{2}$/));
    expect(docRef.get).toHaveBeenCalledTimes(1);
    expect(batch.set).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: "user-123",
        studentName: "Server Name",
        email: "server@example.com",
        confidenceScore: 1,
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

    getUserProfile.mockResolvedValue(null);

    const batch = {
      set: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    };

    const collectionRef = {
      doc: jest.fn(() => ({ get: jest.fn() })),
    };

    getFirestore.mockReturnValue({
      batch: jest.fn(() => batch),
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      json: async () => ({
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
      }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "User profile not found for attendance sync.",
    });
    expect(batch.set).not.toHaveBeenCalled();
    expect(batch.commit).not.toHaveBeenCalled();
  });

  test("normalizes confidence scores into the valid range", () => {
    expect(normalizeConfidenceScore(-2)).toBe(0);
    expect(normalizeConfidenceScore(0.42)).toBe(0.42);
    expect(normalizeConfidenceScore(3.5)).toBe(1);
    expect(normalizeConfidenceScore(Number.NaN)).toBe(0);
  });
});
