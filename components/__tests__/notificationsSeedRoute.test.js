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
  checkRateLimit: vi.fn(),
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

    checkRateLimit.mockResolvedValue({ allowed: true });
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
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
    expect(body.error.message).toBe("Not allowed in production");
    expect(body.error.code).toBe("HTTP_403");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue({ valid: false, reason: "No token" });

    const req = createMockRequest({}, { userId: "user-123" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(body.error.code).toBe("HTTP_401");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects non-admin role (e.g. student) with 403 Forbidden", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "user-student-123", email: "student@domain.com" },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const req = createMockRequest(
      { authorization: "Bearer valid-student-token" },
      { userId: "user-student-123" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Forbidden: Requires one of admin");
    expect(body.error.code).toBe("HTTP_403");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects missing userId in request body with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "user-admin-123", email: "admin@domain.com" },
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = createMockRequest(
      { authorization: "Bearer valid-admin-token" },
      {}
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("userId is required");
    expect(body.error.code).toBe("HTTP_400");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects malformed/invalid JSON payload with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "user-admin-123", email: "admin@domain.com" },
    });
    getUserProfile.mockResolvedValue({ role: "admin" });

    const req = {
      headers: {
        get: (name) => (name.toLowerCase() === "authorization" ? "Bearer valid-admin-token" : null),
      },
      json: vi.fn().mockRejectedValue(new Error("Parse error")),
    };

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid JSON payload");
    expect(body.error.code).toBe("HTTP_400");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("rejects request if rate limit exceeded with 429 Too Many Requests", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "user-admin-123", email: "admin@domain.com" },
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
    expect(body.error.message).toBe("Too many requests. Please slow down.");
    expect(body.error.code).toBe("HTTP_429");
    expect(mockInsertMany).not.toHaveBeenCalled();
  });

  test("successfully inserts mock notifications and returns success for valid admin request", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "user-admin-123", email: "admin@domain.com" },
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
