import { POST as gradesPOST } from "@/app/api/parent/student/[studentId]/grades/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
  getUserProfile: vi.fn(),
  initFirebaseAdmin: vi.fn(),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn().mockReturnValue({
    collection: vi.fn().mockReturnValue({
      add: vi.fn().mockResolvedValue({ id: "mock-firestore-id" }),
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ docs: [] }),
    }),
  }),
}));

vi.mock("@/lib/mongodb", () => {
  const mockCollection = {
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

describe("Grades BOLA Security Tests", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  const createMockRequest = (
    url = "http://localhost",
    headers = {},
    body = null
  ) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer valid-token",
        ...headers,
      })
    );
    const bodyStr = body ? JSON.stringify(body) : "";
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      text: async () => bodyStr,
      json: async () => body,
    };
  };

  test("rejects request if route studentId and body studentId mismatch", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", role: "teacher", email_verified: true },
    });
    getUserProfile.mockImplementation(async (uid) => {
      if (uid === "teacher-1")
        return { role: "teacher", instituteId: "inst-A" };
      return { role: "student", instituteId: "inst-A" };
    });

    const req = createMockRequest(
      "http://localhost",
      {},
      { studentId: "student-2", subject: "Math", grade: "A", score: 90 }
    );
    const res = await gradesPOST(req, { params: { studentId: "student-1" } });

    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("Student ID mismatch");
  });

  test("rejects request if student profile is not found", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", role: "teacher", email_verified: true },
    });
    getUserProfile.mockImplementation(async (uid) => {
      if (uid === "teacher-1")
        return { role: "teacher", instituteId: "inst-A" };
      return null;
    });

    const req = createMockRequest(
      "http://localhost",
      {},
      { studentId: "student-1", subject: "Math", grade: "A", score: 90 }
    );
    const res = await gradesPOST(req, { params: { studentId: "student-1" } });

    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.error).toContain("Student not found");
  });

  test("rejects request if caller instituteId does not match student's instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", role: "teacher", email_verified: true },
    });
    getUserProfile.mockImplementation(async (uid) => {
      if (uid === "teacher-1")
        return { role: "teacher", instituteId: "inst-A" };
      if (uid === "student-1")
        return { role: "student", instituteId: "inst-B" };
      return null;
    });

    const req = createMockRequest(
      "http://localhost",
      {},
      { studentId: "student-1", subject: "Math", grade: "A", score: 90 }
    );
    const res = await gradesPOST(req, { params: { studentId: "student-1" } });

    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.error).toContain(
      "not authorized to access records from another institute"
    );
  });

  test("allows request if caller is admin or matches student instituteId", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "teacher-1", role: "teacher", email_verified: true },
    });
    getUserProfile.mockImplementation(async (uid) => {
      if (uid === "teacher-1")
        return { role: "teacher", instituteId: "inst-A" };
      if (uid === "student-1")
        return { role: "student", instituteId: "inst-A" };
      return null;
    });

    const req = createMockRequest(
      "http://localhost",
      {},
      { studentId: "student-1", subject: "Math", grade: "A", score: 90 }
    );
    const res = await gradesPOST(req, { params: { studentId: "student-1" } });

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
  });
});
