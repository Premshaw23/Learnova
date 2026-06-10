import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/student/course/sync/route";
import { verifyFirebaseToken, getUserProfile } from "@/lib/firebase-admin";
import { connectDb } from "@/lib/mongodb";
import { checkRateLimit } from "@/lib/rateLimit";

// Mock next/server
vi.mock("next/server", () => {
  class MockHeaders {
    constructor(init = {}) {
      this._map = new Map();
      Object.entries(init).forEach(([k, v]) =>
        this._map.set(k.toLowerCase(), v)
      );
    }
    get(name) {
      return this._map.get(name.toLowerCase()) ?? null;
    }
    set(name, value) {
      this._map.set(name.toLowerCase(), value);
    }
  }

  return {
    NextResponse: {
      json: vi.fn().mockImplementation((body, init) => {
        return {
          status: init?.status || 200,
          json: async () => body,
          headers: new MockHeaders(init?.headers || {}),
        };
      }),
    },
  };
});

// Mock firebase admin
vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
  getUserProfile: vi.fn(),
}));

// Mock rateLimit
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

// Mock MongoDB
const mockUpdateOne = vi.fn();
vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("Student Course Progress Sync API", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    connectDb.mockResolvedValue({
      collection: vi.fn().mockReturnValue({
        updateOne: mockUpdateOne,
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
      text: vi.fn().mockResolvedValue(JSON.stringify(bodyData)),
    };
  };

  it("returns 401 when authorization header is missing", async () => {
    const req = createMockRequest({}, null);
    const response = await POST(req);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 429 when rate limited", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "student-123", email: "student@domain.com", email_verified: true, role: "student" },
    });
    getUserProfile.mockResolvedValue({ role: "student" });
    checkRateLimit.mockResolvedValue({ allowed: false });

    const req = createMockRequest({ authorization: "Bearer valid-token" }, []);
    const response = await POST(req);
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.error).toBe("Too many attempts. Please try again later.");
  });

  it("returns 400 when progress payload is malformed", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "student-123", email: "student@domain.com", email_verified: true, role: "student" },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const malformedPayload = {
      courseId: "course-123",
      // missing currentModuleId
      progress: "not-a-number",
      timestamp: "invalid-date",
    };

    const req = createMockRequest({ authorization: "Bearer valid-token" }, malformedPayload);
    const response = await POST(req);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid progress payload structure");
  });

  it("returns 200 and upserts records to MongoDB", async () => {
    verifyFirebaseToken.mockResolvedValue({
      valid: true,
      decodedToken: { uid: "student-123", email: "student@domain.com", email_verified: true, role: "student" },
    });
    getUserProfile.mockResolvedValue({ role: "student" });

    const payload = [
      {
        courseId: "course-123",
        currentModuleId: "module-1",
        progress: 50,
        timestamp: "2026-06-10T12:00:00.000Z",
      },
      {
        courseId: "course-123",
        currentModuleId: "module-2",
        progress: 100,
        timestamp: "2026-06-10T13:00:00.000Z",
      },
    ];

    const req = createMockRequest({ authorization: "Bearer valid-token" }, payload);
    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.count).toBe(2);

    expect(mockUpdateOne).toHaveBeenCalledTimes(2);
    expect(mockUpdateOne).toHaveBeenLastCalledWith(
      { userId: "student-123", courseId: "course-123" },
      expect.objectContaining({
        $set: expect.objectContaining({
          currentModuleId: "module-2",
          progress: 100,
        }),
      }),
      { upsert: true }
    );
  });
});
