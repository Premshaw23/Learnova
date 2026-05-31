import { GET } from "./route";
import { requireAuth } from "@/lib/rbac";
import { getFirestore } from "firebase-admin/firestore";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

describe("attendance heatmap route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns empty array if userId or month parameter is missing", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const request = {
      url: "http://localhost:3000/api/attendance/heatmap?userId=user-123",
      headers: new Headers(),
    };

    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.attendance).toEqual([]);
  });

  test("rejects query with 403 Forbidden if uid does not match authenticated user", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const request = {
      url: "http://localhost:3000/api/attendance/heatmap?userId=user-456&month=2026-05",
      headers: new Headers(),
    };

    await expect(GET(request)).rejects.toThrow("Forbidden: Cannot query attendance for another user");
  });

  test("correctly fetches attendance records from Firestore with date range filter", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

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
    ];

    const mockGet = vi.fn().mockResolvedValue(mockDocs);
    const mockWhere = vi.fn().mockReturnThis();
    const mockCollection = vi.fn(() => ({
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
    expect(body.data.attendance).toHaveLength(2);

    // Verify date sorting (2026-05-02 before 2026-05-15)
    expect(body.data.attendance[0]).toEqual({
      date: "2026-05-02",
      status: "present",
      subject: "Science",
      markedAt: "2026-05-02T10:00:00.000Z",
      _id: "doc-2",
    });

    expect(body.data.attendance[1]).toEqual({
      date: "2026-05-15",
      status: "present",
      subject: "Math",
      markedAt: "2026-05-15T09:00:00.000Z",
      _id: "doc-1",
    });

    expect(mockCollection).toHaveBeenCalledWith("attendance_records");
    expect(mockWhere).toHaveBeenCalledWith("userId", "==", "user-123");
    expect(mockWhere).toHaveBeenCalledWith("date", ">=", "2026-05-01");
    expect(mockWhere).toHaveBeenCalledWith("date", "<=", "2026-05-31");
  });
});
