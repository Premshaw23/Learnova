import { GET } from "@/app/api/labels/route";
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

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

describe("GET /api/labels - Security & Authentication Tests", () => {
  let mockToArray;
  let mockLimit;
  let mockFind;

  beforeEach(() => {
    vi.clearAllMocks();

    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 10 });

    verifyFirebaseToken.mockImplementation(async (token) => {
      if (!token || token === "invalid-token") return { valid: false, reason: "Invalid" };
      return { valid: true, decodedToken: { uid: "mock-uid", email: "user@domain.com" } };
    });

    getUserProfile.mockResolvedValue({ role: "teacher" });

    mockToArray = vi.fn();
    mockLimit = vi.fn().mockReturnValue({
      toArray: mockToArray,
    });
    mockFind = vi.fn().mockReturnValue({
      limit: mockLimit,
    });

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        find: mockFind,
      }),
    });
  });

  const createMockRequest = (tokenVal, ip = "127.0.0.1", url = "http://localhost/api/labels") => {
    const authHeader = tokenVal !== undefined ? (tokenVal ? `Bearer ${tokenVal}` : "") : "Bearer valid-token";
    return {
      url,
      headers: {
        get: vi.fn().mockImplementation((name) => {
          if (name.toLowerCase() === "authorization") {
            return authHeader;
          }
          if (name.toLowerCase() === "x-forwarded-for") {
            return ip;
          }
          return null;
        }),
      },
    };
  };

  test("rejects request if Authorization header is missing (401)", async () => {
    const req = createMockRequest("");

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("rejects request if Firebase token is invalid (401)", async () => {
    const req = createMockRequest("invalid-token");

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("returns projected labels list without image URLs for authenticated users bounded to 50 records (200)", async () => {
    const mockUsers = [
      { name: "Alice", email: "alice@domain.com", image: "https://example.com/alice.jpg", sensitiveField: "secret" },
      { name: "Bob", email: "bob@domain.com", image: "https://example.com/bob.jpg", sensitiveField: "secret" },
    ];
    mockToArray.mockResolvedValue(mockUsers);

    const req = createMockRequest("valid-token");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { name: "Alice", email: "alice@domain.com", sensitiveField: "secret", hasImage: true },
      { name: "Bob", email: "bob@domain.com", sensitiveField: "secret", hasImage: true },
    ]);
    expect(connectDb).toHaveBeenCalled();
    expect(mockFind).toHaveBeenCalledWith({}, { projection: { _id: 1, name: 1, email: 1, image: 1 } });
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  test("applies case-insensitive regex filtering on name and email when search parameter is provided", async () => {
    mockToArray.mockResolvedValue([]);

    const req = createMockRequest("valid-token", "127.0.0.1", "http://localhost/api/labels?search=alice");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockFind).toHaveBeenCalledWith(
      {
        $or: [
          { name: { $regex: "alice", $options: "i" } },
          { email: { $regex: "alice", $options: "i" } },
        ],
      },
      { projection: { _id: 1, name: 1, email: 1, image: 1 } }
    );
    expect(mockLimit).toHaveBeenCalledWith(50);
  });

  test("escapes regex metacharacters in search param before querying MongoDB", async () => {
    mockToArray.mockResolvedValue([]);

    const req = createMockRequest("valid-token", "10.0.0.5", "http://localhost/api/labels?search=test.*%2B%3F");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // Characters like . * + ? should be backslash-escaped by escapeRegex
    expect(mockFind).toHaveBeenCalledWith(
      {
        $or: [
          { name: { $regex: "test\\.\\*\\+\\?", $options: "i" } },
          { email: { $regex: "test\\.\\*\\+\\?", $options: "i" } },
        ],
      },
      { projection: { _id: 1, name: 1, email: 1, image: 1 } }
    );
  });

  test("rate limits requests if more than MAX_ATTEMPTS (10) per IP are made (429)", async () => {
    mockToArray.mockResolvedValue([]);

    let callsCount = 0;
    checkRateLimit.mockImplementation(async () => {
      callsCount++;
      if (callsCount > 10) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: 10 - callsCount };
    });

    // Send 10 successful requests
    for (let i = 0; i < 10; i++) {
      const req = createMockRequest("valid-token");
      const response = await GET(req);
      expect(response.status).toBe(200);
    }

    // 11th request from same IP should trigger 429
    const req11 = createMockRequest("valid-token");
    const response11 = await GET(req11);
    const body11 = await response11.json();

    expect(response11.status).toBe(429);
    expect(body11.error.message).toContain("Too many attempts");
  });

  test("does not expose hasImage flag for student role to prevent enumeration", async () => {
    const mockUsers = [
      { name: "Alice", email: "alice@domain.com", image: "https://example.com/alice.jpg" },
      { name: "Bob", email: "bob@domain.com", image: "https://example.com/bob.jpg" },
    ];
    mockToArray.mockResolvedValue(mockUsers);

    getUserProfile.mockResolvedValue({ role: "student" });

    const req = createMockRequest("valid-token");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([
      { name: "Alice", email: "alice@domain.com" },
      { name: "Bob", email: "bob@domain.com" },
    ]);
    expect(body.data[0]).not.toHaveProperty("hasImage");
    expect(body.data[1]).not.toHaveProperty("hasImage");
  });
});
