import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../../app/api/qa/route";

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

const mockCollection = {
  findOne: vi.fn(),
  find: vi.fn(() => ({
    sort: vi.fn(() => ({
      toArray: vi.fn(() => []),
    })),
    toArray: vi.fn(() => []),
  })),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
};

vi.mock("@/lib/mongodb", () => {
  const db = {
    collection: vi.fn(() => mockCollection),
  };
  return {
    connectDb: vi.fn(() => db),
  };
});

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (fn) => fn,
  parseJSON: vi.fn(),
}));

vi.mock("@/lib/api-response", () => ({
  success: vi.fn((data, status) => ({
    json: async () => data,
    status: status || 200,
  })),
  jsonError: vi.fn((msg, status) => ({
    json: async () => ({ error: msg }),
    status,
  })),
}));

vi.mock("@/lib/ssePublisher", () => ({
  publishEvent: vi.fn(),
}));

vi.mock("@/lib/ai/groq", () => ({
  callGroq: vi.fn(() => "Mock Knowledge Gaps Summary"),
}));

describe("Q&A Session API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET", () => {
    it("should return Q&A session and list of questions", async () => {
      const mockRequest = {
        url: "http://localhost/api/qa?sessionId=60c72b2f9b1d8b1f488f28c2",
      };

      const requireAuth = await import("@/lib/rbac").then((m) => m.requireAuth);
      requireAuth.mockResolvedValue({ uid: "user123", role: "student" });

      mockCollection.findOne.mockResolvedValue({
        _id: "60c72b2f9b1d8b1f488f28c2",
        title: "Test Session",
        status: "active",
      });

      const response = await GET(mockRequest);
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session.title).toBe("Test Session");
    });
  });

  describe("POST", () => {
    it("should create a new Q&A session for teacher", async () => {
      const requireAuth = await import("@/lib/rbac").then((m) => m.requireAuth);
      requireAuth.mockResolvedValue({ uid: "teacher123", role: "teacher" });

      const parseJSON = await import("@/lib/error-handler").then((m) => m.parseJSON);
      parseJSON.mockResolvedValue({
        action: "create",
        title: "New Q&A Session",
      });

      mockCollection.insertOne.mockResolvedValue({ insertedId: "mockSessionId" });

      const response = await POST({});
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.sessionId).toBe("mockSessionId");
    });
  });
});
