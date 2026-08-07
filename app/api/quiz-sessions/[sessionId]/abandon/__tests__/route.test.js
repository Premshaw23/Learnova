import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { connectDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/rbac";

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

function createMockRequest() {
  return {};
}

describe("POST /api/quiz-sessions/[sessionId]/abandon — completion guard", () => {
  let findOne;
  let deleteOne;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });

    deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

    db = {
      collection: vi.fn((name) => {
        if (name === "quiz_sessions") {
          return { findOne, deleteOne };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    connectDb.mockResolvedValue(db);
  });

  it("rejects with 409 and does not delete when the session is already completed/scored", async () => {
    findOne = vi.fn().mockResolvedValue({
      _id: "session-1",
      userId: "user-123",
      quizId: "quiz-1",
      completed: true,
      score: 8,
      percentage: 80,
      passed: true,
    });
    db.collection = vi.fn(() => ({ findOne, deleteOne }));
    connectDb.mockResolvedValue(db);

    const req = createMockRequest();
    const response = await POST(req, {
      params: Promise.resolve({ sessionId: "session-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({ error: "Cannot abandon a submitted quiz" });
    expect(deleteOne).not.toHaveBeenCalled();
  });

  it("still deletes normally when the session is incomplete", async () => {
    findOne = vi.fn().mockResolvedValue({
      _id: "session-2",
      userId: "user-123",
      quizId: "quiz-1",
      completed: false,
    });
    db.collection = vi.fn(() => ({ findOne, deleteOne }));
    connectDb.mockResolvedValue(db);

    const req = createMockRequest();
    const response = await POST(req, {
      params: Promise.resolve({ sessionId: "session-2" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: "Session abandoned" });
    expect(deleteOne).toHaveBeenCalledWith({
      _id: "session-2",
      completed: { $ne: true },
    });
  });

  it("returns 403 and does not touch completed sessions belonging to another user", async () => {
    findOne = vi.fn().mockResolvedValue({
      _id: "session-3",
      userId: "other-user",
      quizId: "quiz-1",
      completed: true,
    });
    db.collection = vi.fn(() => ({ findOne, deleteOne }));
    connectDb.mockResolvedValue(db);

    const req = createMockRequest();
    const response = await POST(req, {
      params: Promise.resolve({ sessionId: "session-3" }),
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(deleteOne).not.toHaveBeenCalled();
  });
});