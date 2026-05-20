import { POST, rateLimitMap } from "@/app/api/register/route";
import { connectDb } from "@/lib/mongodb";
import { put } from "@vercel/blob";
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

jest.mock("@vercel/blob", () => ({
  put: jest.fn(),
}));

jest.mock("@/lib/mongodb", () => ({
  connectDb: jest.fn(),
}));

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
}));

describe("POST /api/register - Authentication & Validation Security Tests", () => {
  let mockFindOne;
  let mockInsertOne;

  beforeEach(() => {
    jest.clearAllMocks();

    if (rateLimitMap) {
      rateLimitMap.clear();
    }

    verifyFirebaseToken.mockImplementation(async (token) => {
      if (!token || token === "invalid-token") return null;
      return { uid: "mock-uid", email: token };
    });

    mockFindOne = jest.fn();
    mockInsertOne = jest.fn();

    connectDb.mockResolvedValue({
      collection: jest.fn().mockReturnValue({
        findOne: mockFindOne,
        insertOne: mockInsertOne,
      }),
    });

    put.mockResolvedValue({ url: "https://example.com/blob.jpg" });
  });

  const mockFile = {
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    type: "image/jpeg",
  };

  const createMockRequest = (data, tokenVal) => {
    const emailVal = data.email;
    const authHeader = tokenVal !== undefined ? (tokenVal ? `Bearer ${tokenVal}` : "") : `Bearer ${emailVal}`;
    return {
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name.toLowerCase() === "authorization") {
            return authHeader;
          }
          if (name.toLowerCase() === "x-forwarded-for") {
            return data.ip || "127.0.0.1";
          }
          return null;
        }),
      },
      formData: jest.fn().mockResolvedValue({
        get: (key) => data[key],
      }),
    };
  };

  test("accepts valid email and registers user successfully", async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: "mock-id" });

    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user+tag@domain.co.uk",
      photo: mockFile,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe("user+tag@domain.co.uk");
    expect(mockInsertOne).toHaveBeenCalled();
  });

  test.each([
    ["invalid-email"],
    ["test@domain"],
    ["@domain.com"],
    ["user@domain."],
    ["user @domain.com"],
    ["user@ domain.com"],
  ])("rejects invalid email format '%s' with 400 Bad Request", async (invalidEmail) => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: invalidEmail,
      photo: mockFile,
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid email address");
    expect(mockInsertOne).not.toHaveBeenCalled();
    expect(connectDb).not.toHaveBeenCalled(); // Validation must happen before DB connection or insertion
  });

  test("rejects request if Authorization header is missing (401)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: mockFile,
    }, ""); // empty token

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects request if Firebase token is invalid (401)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: mockFile,
    }, "invalid-token");

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects request if authenticated email does not match requested email (403)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: mockFile,
    }, "different-user@domain.com");

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toContain("Forbidden");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rate limits requests if more than MAX_ATTEMPTS (5) per IP are made (429)", async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: "mock-id" });

    // Send 5 successful requests
    for (let i = 0; i < 5; i++) {
      const req = createMockRequest({
        name: "John Doe",
        rollNo: `12345${i}`,
        email: "user@domain.com",
        photo: mockFile,
      });
      const response = await POST(req);
      expect(response.status).toBe(201);
    }

    // 6th request from the same IP should trigger 429
    const req6 = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: mockFile,
    });
    const response6 = await POST(req6);
    const body6 = await response6.json();

    expect(response6.status).toBe(429);
    expect(body6.error).toContain("Too many registration attempts");
  });
});
