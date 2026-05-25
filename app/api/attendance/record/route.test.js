import { POST } from "./route";
import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

jest.mock("@/lib/error-handler", () => ({
  authenticateRequest: jest.fn(),
  withErrorHandler: (handler) => handler,
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

describe("attendance record route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("writes attendance to Firestore with canonical doc id + instituteId", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });

    getUserProfile.mockResolvedValue({
      fullName: "Server Name",
      email: "server@example.com",
      instituteId: "inst-999",
    });

    const set = jest.fn().mockResolvedValue(undefined);
    const docRef = { set };
    const collectionRef = { doc: jest.fn(() => docRef) };

    getFirestore.mockReturnValue({
      collection: jest.fn(() => collectionRef),
    });

    const response = await POST({
      json: async () => ({
        userId: "user-123",
        studentName: "Client Name",
        email: "client@example.com",
        confidenceScore: 75,
        date: "2026-05-25",
      }),
      headers: new Headers([["authorization", "Bearer test"]]),
      cookies: { get: jest.fn() },
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { alreadyRecorded: false },
    });

    expect(collectionRef.doc).toHaveBeenCalledWith("user-123_2026-05-25");
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        studentName: "Server Name",
        email: "server@example.com",
        instituteId: "inst-999",
        date: "2026-05-25",
        status: "present",
        offlineSynced: false,
        timestamp: FieldValue.serverTimestamp.mock.results[0].value,
      }),
      { merge: true },
    );
  });
});

