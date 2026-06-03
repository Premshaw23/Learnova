import { POST } from "@/app/api/notifications/seed/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";

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

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

describe("POST /api/notifications/seed - Security and Validation Tests", () => {
  let mockInsertMany;
  let originalNodeEnv;

  beforeAll(() => {
    originalNodeEnv = process.env.NODE_ENV;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "development";

    mockInsertMany = vi.fn().mockResolvedValue({ acknowledged: true });
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        insertMany: mockInsertMany,
      }),
    });

    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
      text: vi.fn().mockResolvedValue(JSON.stringify(bodyData)),
    };
  };

  test("rejects request in production environment with 403 Forbidden", async () => {
    process.env.NODE_ENV = "production";

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      { userId: "user-admin-123" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    // jsonError/fail() returns body.error as a flat string
    expect(body.error).toContain("Not allowed in production");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: false, reason: "No token" });

    const req = createMockRequest({}, { userId: "user-123" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toContain("Unauthorized");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects non-admin seeding for another user with 403 Forbidden", async () => {
    // Student token with email_verified so auth passes, but student cannot seed for others
    verifyFirebaseToken.mockResolvedValue({
      uid: "user-student-123",
      email: "student@domain.com",
      email_verified: true,
      role: "student",
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-student-token" },
      { userId: "other-user-456" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Forbidden");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects missing userId in request body with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      uid: "user-admin-123",
      email: "admin@domain.com",
      email_verified: true,
      role: "admin",
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      {}
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("userId is required");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects malformed/invalid JSON payload with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      uid: "user-admin-123",
      email: "admin@domain.com",
      email_verified: true,
      role: "admin",
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    // parseJSON calls request.text() then JSON.parse — return invalid JSON string
    const req = {
      headers: {
        get: (name) =>
          name.toLowerCase() === "authorization"
            ? "Bearer valid-admin-token"
            : null,
      },
      json: vi.fn().mockRejectedValue(new Error("Parse error")),
      text: vi.fn().mockResolvedValue("{invalid-json:::"),
    };

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid JSON payload");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects request if rate limit exceeded with 429 Too Many Requests", async () => {
    verifyFirebaseToken.mockResolvedValue({
      uid: "user-admin-123",
      email: "admin@domain.com",
      email_verified: true,
      role: "admin",
    });
    getUserProfile.mockResolvedValue({ role: "admin" });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      { userId: "user-target-123" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toContain("Too many requests");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("successfully inserts mock notifications and returns success for valid admin request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      uid: "user-admin-123",
      email: "admin@domain.com",
      email_verified: true,
      role: "admin",
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      { userId: "user-target-123" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockInsertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: "user-target-123",
        message: "Attendance marked for CS101",
        type: "attendance",
        read: false,
      }),
      expect.objectContaining({
        userId: "user-target-123",
        message: "New notice posted by Admin",
        type: "notice",
        read: false,
      }),
      expect.objectContaining({
        userId: "user-target-123",
        message: "System alert: Maintenance scheduled",
        type: "alert",
        read: false,
      }),
    ]);
  });
});
