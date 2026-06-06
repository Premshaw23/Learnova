// [Paste the complete code block block from above here]
import { describe, test, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { requireAuth } from "@/lib/rbac";
import { getFirestore } from "firebase-admin/firestore";

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
    json: vi.fn().mockImplementation((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

describe("attendance heatmap route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (urlStr) => {
    const headersMap = new Map([["x-forwarded-for", "127.0.0.1"]]);
    return {
      url: urlStr,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
    };
  };

  test("returns empty array if userId or month parameter is missing", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const request = createMockRequest("http://localhost:3000/api/attendance/heatmap?userId=");
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const body = await response.json();
    
    const targetPayload = body.attendance !== undefined ? body.attendance : body;
    expect(targetPayload).toEqual([]);
  });

  test("rejects query with 403 Forbidden if uid does not match authenticated user", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123" });

    const request = createMockRequest("http://localhost:3000/api/attendance/heatmap?userId=user-456&month=2026-05");
    const response = await GET(request);
    
    expect(response.status).toBe(403);
  });

  test("correctly fetches attendance records from Firestore and filters by month", async () => {
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
      {
        id: "doc-3",
        data: () => ({
          userId: "user-123",
          date: "2026-06-01",
          status: "present",
          subject: "English",
          timestamp: { toDate: () => new Date("2026-06-01T08:00:00Z") },
        }),
      },
    ];

    // Mocking the query snapshot with an executable .forEach() iterator method
    const mockSnapshot = {
      forEach: (callback) => mockDocs.forEach(callback),
      docs: mockDocs,
    };

    const mockGet = vi.fn().mockResolvedValue(mockSnapshot);
    
    // Support nested method chaining for multiple .where handles safely
    const mockWhereChain = {
      where: vi.fn().mockReturnThis(),
      get: mockGet,
    };
    
    const mockCollection = vi.fn(() => ({
      where: vi.fn(() => mockWhereChain),
    }));

    getFirestore.mockReturnValue({
      collection: mockCollection,
    });

    const request = createMockRequest("http://localhost:3000/api/attendance/heatmap?userId=user-123&month=2026-05");
    const response = await GET(request);
    
    expect(response.status).toBe(200);

    const body = await response.json();
    
    // Normalize matching wrapper access rules
    const attendanceResult = body.attendance !== undefined ? body.attendance : body;
    expect(attendanceResult).toHaveLength(2);

    expect(attendanceResult[0]).toEqual({
      date: "2026-05-02",
      status: "present",
      subject: "Science",
      markedAt: "2026-05-02T10:00:00.000Z",
      _id: "doc-2",
    });

    expect(attendanceResult[1]).toEqual({
      date: "2026-05-15",
      status: "present",
      subject: "Math",
      markedAt: "2026-05-15T09:00:00.000Z",
      _id: "doc-1",
    });

    expect(mockCollection).toHaveBeenCalledWith("attendance_records");
  });
});