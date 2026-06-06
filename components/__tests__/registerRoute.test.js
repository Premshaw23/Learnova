import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from "@/app/api/register/route";
import { connectDb } from "@/lib/mongodb";
import { put, del } from "@vercel/blob";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

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

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
  del: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
}));

describe("POST /api/register - Authentication, Rollback, and Validation Security Tests", () => {
  let mockFindOne;
  let mockInsertOne;

  const extractError = (body) => {
    if (!body) return "";
    if (typeof body === "string") return body;
    if (typeof body.error === "string") return body.error;
    if (body.error?.message) return body.error.message;
    if (body.message) return body.message;
    return JSON.stringify(body);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true });

    mockFindOne = vi.fn();
    mockInsertOne = vi.fn();

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        findOne: mockFindOne,
        insertOne: mockInsertOne,
        createIndex: vi.fn().mockResolvedValue({}),
      }),
    });

    put.mockResolvedValue({ url: "https://example.com/blob.jpg" });
    del.mockResolvedValue();

    verifyFirebaseToken.mockImplementation(async (token) => {
      if (!token || token === "invalid-token") return null;
      return {
        uid: "mock-uid",
        email: token.includes("@") ? token : "user@domain.com",
      };
    });
  });

  const createMockFile = (mimeType, size, magicBytes = []) => {
    const buffer = new Uint8Array(magicBytes.concat(new Array(Math.max(0, 12 - magicBytes.length)).fill(0))).buffer;
    const BaseClass = typeof File !== "undefined" ? File : class {};
    const mockFileObj = Object.create(BaseClass.prototype);
    Object.defineProperty(mockFileObj, "type", { value: mimeType, enumerable: true, configurable: true });
    Object.defineProperty(mockFileObj, "size", { value: size, enumerable: true, configurable: true });
    Object.defineProperty(mockFileObj, "arrayBuffer", { value: vi.fn().mockResolvedValue(buffer), enumerable: true, configurable: true });
    return mockFileObj;
  };

  const createMockRequest = (data, token = "user@domain.com") => {
    const headersMap = new Map();
    headersMap.set("x-forwarded-for", data.ip || "127.0.0.1");
    if (token) {
      headersMap.set("authorization", `Bearer ${token}`);
    }

    return {
      headers: {
        get: vi.fn().mockImplementation((key) => headersMap.get(key.toLowerCase()) || null),
      },
      formData: vi.fn().mockResolvedValue({
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
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
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
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(extractError(body).toLowerCase()).toContain("email format");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects request if Authorization header is missing (401)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    }, "");

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(extractError(body).toLowerCase()).toContain("unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects request if Firebase token is invalid (401)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    }, "invalid-token");

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(extractError(body).toLowerCase()).toContain("unauthorized");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rejects request if authenticated email does not match requested email (403)", async () => {
    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    }, "different-user@domain.com");

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(extractError(body).toLowerCase()).toContain("forbidden");
    expect(mockInsertOne).not.toHaveBeenCalled();
  });

  test("rate limits requests if more than MAX_ATTEMPTS (5) per IP are made (429)", async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockResolvedValue({ insertedId: "mock-id" });
    checkRateLimit.mockResolvedValue({ allowed: false });
    
    const req6 = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    });
    const response6 = await POST(req6);
    const body6 = await response6.json();

    expect(response6.status).toBe(429);
    expect(extractError(body6).toLowerCase()).toContain("attempts");
  });

  test("deletes uploaded blob if database insertion fails (rollback)", async () => {
    mockFindOne.mockResolvedValue(null);
    mockInsertOne.mockRejectedValue(new Error("Database write failed"));

    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(extractError(body).toLowerCase()).toContain("server error");
    expect(put).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith("https://example.com/blob.jpg");
  });

  test("handles MongoDB unique index duplicate key error (E11000) by returning 409 and rolling back blob upload", async () => {
    mockFindOne.mockResolvedValue(null);
    
    const duplicateKeyError = new Error("E11000 duplicate key error collection: users index: email_1 dup key");
    duplicateKeyError.code = 11000;
    mockInsertOne.mockRejectedValue(duplicateKeyError);

    const req = createMockRequest({
      name: "John Doe",
      rollNo: "123456",
      email: "user@domain.com",
      photo: createMockFile("image/jpeg", 1024, [0xff, 0xd8, 0xff]),
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(extractError(body).toLowerCase()).toContain("already registered");
    expect(put).toHaveBeenCalled();
    expect(del).toHaveBeenCalledWith("https://example.com/blob.jpg");
  });
});
