import { GET } from "./route";
import { requireRole } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { getFirestore } from "firebase-admin/firestore";
import { getUserProfile } from "@/lib/firebase-admin";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
}));

vi.mock("@/lib/api-response", () => ({
  success: (data) => ({
    status: 200,
    json: async () => data,
  }),
  fail: (status, code, message) => ({
    status,
    json: async () => ({ error: message }),
  }),
}));

vi.mock("@/lib/rbac", () => ({
  requireRole: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
}));

const createMockDocs = (docs) => ({
  forEach: (fn) => docs.forEach(fn),
});

function createMockFirestore() {
  const mockGet = vi.fn();
  const mockWhere = vi.fn().mockReturnThis();
  const mockCollection = vi.fn(() => ({
    where: mockWhere,
    get: mockGet,
  }));
  getFirestore.mockReturnValue({
    collection: mockCollection,
  });
  return { mockGet, mockWhere, mockCollection };
}

function mockRequest(url) {
  return { url, headers: new Headers([["x-forwarded-for", "127.0.0.1"]]) };
}

describe("attendance heatmap API route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("derives userId from token when no explicit userId provided", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { role: "student" },
    });
    const { mockGet } = createMockFirestore();
    mockGet.mockResolvedValue(createMockDocs([]));

    const req = mockRequest("http://localhost/api/attendance/heatmap?month=2026-06");
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  test("rejects student querying another user", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { role: "student" },
    });

    const req = mockRequest("http://localhost/api/attendance/heatmap?userId=other-user&month=2026-06");
    await expect(GET(req)).rejects.toThrow("Forbidden: Cannot query attendance for another user");
  });

  test("allows admin to query any user", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "admin-1", role: "admin" },
      profile: { role: "admin" },
    });
    getUserProfile.mockImplementation((uid) => {
      if (uid === "admin-1") return Promise.resolve({ instituteId: "inst-1" });
      if (uid === "student-42") return Promise.resolve({ instituteId: "inst-1" });
      return Promise.resolve(null);
    });
    const { mockGet } = createMockFirestore();
    mockGet.mockResolvedValue(createMockDocs([]));

    const req = mockRequest("http://localhost/api/attendance/heatmap?userId=student-42&month=2026-06");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  test("allows teacher to query any user", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher", subjects: ["Math"] },
    });
    getUserProfile.mockImplementation((uid) => {
      if (uid === "teacher-1") return Promise.resolve({ instituteId: "inst-1" });
      if (uid === "student-42") return Promise.resolve({ instituteId: "inst-1", role: "student", subjects: ["Math"] });
      return Promise.resolve(null);
    });
    const { mockGet } = createMockFirestore();
    mockGet.mockResolvedValue(createMockDocs([]));

    const req = mockRequest("http://localhost/api/attendance/heatmap?userId=student-42&month=2026-06");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  test("rejects teacher querying student they do not teach", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "teacher-1", role: "teacher" },
      profile: { role: "teacher", subjects: ["Math"] },
    });
    getUserProfile.mockResolvedValue({
      role: "student",
      subjects: ["History"],
    });

    const req = mockRequest("http://localhost/api/attendance/heatmap?userId=student-42&month=2026-06");
    await expect(GET(req)).rejects.toThrow("Forbidden: You are not authorized to view this student's attendance heatmap");
  });

  test("allows student to query own data with explicit userId", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { role: "student" },
    });
    const { mockGet } = createMockFirestore();
    mockGet.mockResolvedValue(createMockDocs([]));

    const req = mockRequest("http://localhost/api/attendance/heatmap?userId=student-1&month=2026-06");
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  test("rejects invalid month format with 400 Validation Error", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { role: "student" },
    });

    const req = mockRequest("http://localhost/api/attendance/heatmap?month=invalid");
    await expect(GET(req)).rejects.toThrow("Invalid month format. Expected YYYY-MM.");
  });

  test("returns empty array when month is missing", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "student-1", role: "student" },
      profile: { role: "student" },
    });

    const req = mockRequest("http://localhost/api/attendance/heatmap");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attendance).toEqual([]);
  });

  test("correctly fetches attendance records from Firestore with date range filter", async () => {
    requireRole.mockResolvedValue({
      payload: { uid: "user-123", role: "student" },
      profile: { role: "student" },
    });

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

    const { mockGet } = createMockFirestore();
    mockGet.mockResolvedValue(createMockDocs(mockDocs));

    const req = mockRequest("http://localhost/api/attendance/heatmap?month=2026-05");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.attendance).toHaveLength(2);

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
  });
});