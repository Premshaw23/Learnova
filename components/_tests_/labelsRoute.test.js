import { GET, rateLimitMap } from "@/app/api/labels/route";
import { connectDb } from "@/lib/mongodb";
import { verifyFirebaseToken } from "@/lib/firebase-admin";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
        headers: new Map(),
      };
    }),
  },
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
}));

describe("GET /api/labels - Security & Authentication Tests", () => {
  let mockToArray;
  let mockFind;

  beforeEach(() => {
    jest.clearAllMocks();

    if (rateLimitMap) {
      rateLimitMap.clear();
    }

    verifyFirebaseToken.mockImplementation(async (token) => {
      if (!token || token === "invalid-token") return null;
      return { uid: "mock-uid", email: "user@domain.com" };
    });

    mockToArray = jest.fn();
    mockFind = jest.fn().mockReturnValue({
      toArray: mockToArray,
    });

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        find: mockFind,
      }),
    });
  });

  const createMockRequest = (tokenVal, ip = "127.0.0.1") => {
    const authHeader = tokenVal !== undefined ? (tokenVal ? `Bearer ${tokenVal}` : "") : "Bearer valid-token";
    return {
      headers: {
        get: jest.fn().mockImplementation((name) => {
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
    expect(body.error).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("rejects request if Firebase token is invalid (401)", async () => {
    const req = createMockRequest("invalid-token");

    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(connectDb).not.toHaveBeenCalled();
  });

  test("returns projected labels list for authenticated users (200)", async () => {
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
    expect(body.data).toEqual(mockUsers);
    expect(connectDb).toHaveBeenCalled();
    expect(mockFind).toHaveBeenCalledWith({}, { projection: { _id: 0, name: 1, email: 1, image: 1 } });
  });

  test("rate limits requests if more than MAX_ATTEMPTS (10) per IP are made (429)", async () => {
    mockToArray.mockResolvedValue([]);

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
    expect(body11.error).toContain("Too many attempts");
  });
});
