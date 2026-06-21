import { POST } from "@/app/api/student/gamification/award/route";
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
}));

describe("POST /api/student/gamification/award - Security and RBAC Tests", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
    };
  };

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: false, reason: "No token" });

    const req = createMockRequest({}, { actionType: "attendance_marked" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("Unauthorized");
    expect(body.errorObj.code).toBe("HTTP_401");
  });

  test("rejects all authenticated users with 403 because manual XP awards are disabled", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "user-student-123",
        email: "student@domain.com",
        email_verified: true,
        role: "student",
      },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const req = createMockRequest(
      { authorization: "Bearer valid-student-token" },
      { actionType: "attendance_marked" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Direct client-side XP awards are disabled.");
    expect(body.errorObj.code).toBe("HTTP_403");
  });

  test("rejects admin role with 403 Forbidden because manual awards are disabled", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: {
        uid: "user-admin-123",
        email: "admin@domain.com",
        email_verified: true,
        role: "admin",
      },
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      { actionType: "attendance_marked" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe("Direct client-side XP awards are disabled.");
    expect(body.errorObj.code).toBe("HTTP_403");
  });
});
