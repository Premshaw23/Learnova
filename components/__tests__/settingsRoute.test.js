import { PATCH } from "@/app/api/settings/route";
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
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

describe("PATCH /api/settings - Security, Role-Based Access and Audit Logging Tests", () => {
  let mockUpdateOne;
  let originalConsoleLog;
  let consoleLogMock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateOne = vi.fn();
    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        updateOne: mockUpdateOne,
      }),
    });

    originalConsoleLog = console.log;
    consoleLogMock = vi.fn();
    console.log = consoleLogMock;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
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

  test("rejects unauthenticated request (missing authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({}, { theme: "dark" });
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("rejects unauthenticated request (invalid token) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({ authorization: "Bearer invalid-token" }, { theme: "dark" });
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  test("allows user to update their own settings successfully (no userId specified in body)", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { theme: "dark", notifications: true }
    );
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Settings saved successfully");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: "user-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          theme: "dark",
          notifications: true,
          updatedAt: expect.any(Date),
        }),
      }),
      { upsert: true }
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("[Audit Log] Settings updated successfully for target user: user-123 by operator: user-123 (Role: owner)")
    );
  });

  test("allows user to update their own settings successfully when bodyUserId matches authenticated uid", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userId: "user-123", theme: "light" }
    );
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Settings saved successfully");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: "user-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          theme: "light",
          updatedAt: expect.any(Date),
        }),
      }),
      { upsert: true }
    );
  });

  test("rejects standard user trying to update another user's settings with 403 Forbidden", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });
    getUserProfile.mockResolvedValue({ role: "student" }); // Not an admin

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userId: "another-user-456", theme: "dark" }
    );
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Forbidden");
    expect(mockUpdateOne).not.toHaveBeenCalled();
    expect(getUserProfile).toHaveBeenCalledWith("user-123");
  });

  test("allows admin to update another user's settings successfully with 200 OK and logs audit line", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "admin-789", email: "admin@example.com", email_verified: true });
    getUserProfile.mockResolvedValue({ role: "admin" });
    mockUpdateOne.mockResolvedValue({ acknowledged: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { userId: "victim-user-123", theme: "dark" }
    );
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Settings saved successfully");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { userId: "victim-user-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          theme: "dark",
          updatedAt: expect.any(Date),
        }),
      }),
      { upsert: true }
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("[Audit Log] Settings updated successfully for target user: victim-user-123 by operator: admin-789 (Role: admin)")
    );
  });

  test("rejects request with unrecognized fields with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { nonexistentField: "should not be allowed" }
    );
    const response = await PATCH(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Bad Request");
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });
});
