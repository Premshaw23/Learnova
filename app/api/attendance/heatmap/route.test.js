import { GET } from "./route";
import { authenticateRequest } from "@/lib/error-handler";
import { getFirestore } from "firebase-admin/firestore";

jest.mock("@/lib/error-handler", () => ({
  authenticateRequest: jest.fn(),
  withErrorHandler: (handler) => handler,
}));

jest.mock("@/lib/rateLimit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

jest.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: jest.fn(),
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("attendance heatmap route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns empty array if userId or month parameter is missing", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });

    const request = {
      url: "http://localhost:3000/api/attendance/heatmap?userId=user-123",
      headers: new Headers(),
    };

    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.attendance).toEqual([]);
  });

  test("rejects query with 403 Forbidden if uid does not match authenticated user", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });

    const request = {
      url: "http://localhost:3000/api/attendance/heatmap?userId=user-456&month=2026-05",
      headers: new Headers(),
    };

    await expect(GET(request)).rejects.toThrow("Forbidden: Cannot query attendance for another user");
  });

  test("correctly fetches attendance records from Firestore and filters by month", async () => {
    authenticateRequest.mockResolvedValue({ uid: "user-123" });

    const mockDocs = [
      {
        id: "doc-1",
        data: () => ({
          userId: "user-123",
          date: "2026-05-15",
          status: "present",
          subject: "Math",
          timestamp: { toDate: () => new Date("2026-05-15T09:00:00Z") },
        }),
      },
      {
        id: "doc-2",
        data: () => ({
          userId: "user-123",
          date: "2026-05-02",
          status: "present",
          subject: "Science",
          timestamp: { toDate: () => new Date("2026-05-02T10:00:00Z") },
        }),
      },
      {
        id: "doc-3",
        // Unrelated month should be filtered out in-memory
        data: () => ({
          userId: "user-123",
          date: "2026-06-01",
          status: "present",
          subject: "English",
          timestamp: { toDate: () => new Date("2026-06-01T08:00:00Z") },
        }),
      },
    ];

    const mockGet = jest.fn().mockResolvedValue(mockDocs);
    const mockWhere = jest.fn().mockReturnThis();
    const mockCollection = jest.fn(() => ({
      where: mockWhere,
      get: mockGet,
    }));

    getFirestore.mockReturnValue({
      collection: mockCollection,
    });

    const request = {
      url: "http://localhost:3000/api/attendance/heatmap?userId=user-123&month=2026-05",
      headers: new Headers([["x-forwarded-for", "127.0.0.1"]]),
    };

    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.attendance).toHaveLength(2);

    // Verify correct filtering of June record and date sorting (2026-05-02 before 2026-05-15)
    expect(body.attendance[0]).toEqual({
      date: "2026-05-02",
      status: "present",
      subject: "Science",
      markedAt: "2026-05-02T10:00:00.000Z",
      _id: "doc-2",
    });

    expect(body.attendance[1]).toEqual({
      date: "2026-05-15",
      status: "present",
      subject: "Math",
      markedAt: "2026-05-15T09:00:00.000Z",
      _id: "doc-1",
    });

    expect(mockCollection).toHaveBeenCalledWith("attendance_records");
    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-123");
  });
});
