import { POST, GET } from "../route";
import { parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { connectDb } from "@/lib/mongodb";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => async (request, ...args) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return {
        status: error.statusCode ?? 500,
        json: async () => ({ error: error.message }),
      };
    }
  },
  parseJSON: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockDb = {
    collection: vi.fn(() => ({
      updateOne: vi.fn().mockResolvedValue({}),
      findOne: vi.fn().mockResolvedValue({ firebaseUid: "student-123", name: "Alice Student", faceDescriptor: [0.1, 0.2] }),
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

describe("Exam Verification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (userId, role = "student", method = "POST", body = {}, queryParams = {}) => {
    const headersMap = new Map([
      ["x-forwarded-for", "127.0.0.1"],
      ["authorization", "Bearer token"],
    ]);
    const urlParams = new URLSearchParams();
    if (body.examId) urlParams.append("examId", body.examId);
    if (queryParams.userId) urlParams.append("userId", queryParams.userId);
    return {
      method,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      url: `http://localhost/api/verify?${urlParams.toString()}`,
    };
  };

  test("POST: logs a verification record successfully", async () => {
    requireAuth.mockResolvedValue({ uid: "student-123" });
    getUserProfile.mockResolvedValue({ role: "student", fullName: "Alice Student" });
    parseJSON.mockResolvedValue({
      examId: "exam-999",
      userId: "student-123",
      studentName: "Alice Student",
      status: "verified",
      confidence: 85,
    });

    const req = createMockRequest("student-123", "student", "POST", { examId: "exam-999" });
    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  test("POST: fails if student tries to log for another student", async () => {
    requireAuth.mockResolvedValue({ uid: "student-123" });
    getUserProfile.mockResolvedValue({ role: "student", fullName: "Alice Student" });
    parseJSON.mockResolvedValue({
      examId: "exam-999",
      userId: "student-456",
      status: "verified",
    });

    const req = createMockRequest("student-123", "student", "POST", { examId: "exam-999" });
    const response = await POST(req);
    expect(response.status).toBe(403);
  });

  test("GET: retrieves verification logs for instructor", async () => {
    requireAuth.mockResolvedValue({ uid: "teacher-123" });
    getUserProfile.mockResolvedValue({ role: "teacher", fullName: "Dr. Teacher" });

    const req = createMockRequest("teacher-123", "teacher", "GET", { examId: "exam-999" });
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  test("GET: fails for student", async () => {
    requireAuth.mockResolvedValue({ uid: "student-123" });
    getUserProfile.mockResolvedValue({ role: "student", fullName: "Alice Student" });

    const req = createMockRequest("student-123", "student", "GET", { examId: "exam-999" });
    const response = await GET(req);
    expect(response.status).toBe(403);
  });

  test("GET: retrieves faceDescriptor for authorized student", async () => {
    requireAuth.mockResolvedValue({ uid: "student-123" });
    getUserProfile.mockResolvedValue({ role: "student", fullName: "Alice Student" });

    const req = createMockRequest("student-123", "student", "GET", {}, { userId: "student-123" });
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  test("GET: retrieves faceDescriptor for instructor querying a student", async () => {
    requireAuth.mockResolvedValue({ uid: "teacher-123" });
    getUserProfile.mockResolvedValue({ role: "teacher", fullName: "Dr. Teacher" });

    const req = createMockRequest("teacher-123", "teacher", "GET", {}, { userId: "student-123" });
    const response = await GET(req);
    expect(response.status).toBe(200);
  });
});
