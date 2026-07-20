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

const FUTURE_DATE = new Date(Date.now() + 60 * 60 * 1000);

function createMockRequest(body) {
  return {
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("POST /api/quiz-sessions/submit — completion race guard", () => {
  let findOneSession;
  let findOneQuiz;
  let updateOne;
  let db;

  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({ uid: "user-123" });

    findOneSession = vi.fn().mockResolvedValue({
      _id: "session-1",
      userId: "user-123",
      quizId: "quiz-1",
      expiresAt: FUTURE_DATE,
      completed: false,
      answers: { q1: "A", q2: "B" },
    });

    findOneQuiz = vi.fn().mockResolvedValue({
      _id: "quiz-1",
      passingScore: 70,
      questions: [
        { _id: "q1", correctAnswer: "A" },
        { _id: "q2", correctAnswer: "wrong" },
      ],
    });

    updateOne = vi.fn().mockResolvedValue({ matchedCount: 1 });

    db = {
      collection: vi.fn((name) => {
        if (name === "quiz_sessions") {
          return { findOne: findOneSession, updateOne };
        }
        if (name === "quizzes") {
          return { findOne: findOneQuiz };
        }
        throw new Error(`Unexpected collection: ${name}`);
      }),
    };

    connectDb.mockResolvedValue(db);
  });

  it("includes completed: { $ne: true } in the updateOne filter (atomic guard)", async () => {
    const req = createMockRequest({ sessionId: "session-1" });

    await POST(req);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: "session-1", completed: { $ne: true } },
      expect.objectContaining({
        $set: expect.objectContaining({ completed: true }),
      })
    );
  });

  it("returns the computed score when this call wins the race", async () => {
    const req = createMockRequest({ sessionId: "session-1" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.score).toBe(1);
    expect(body.totalQuestions).toBe(2);
    expect(body.percentage).toBe(50);
  });

  it("rejects with 'Quiz already submitted' instead of a false 200 if a concurrent submit won the race (matchedCount 0)", async () => {
    // Simulates two concurrent /submit calls: both pass the application-level
    // `session.completed` check and compute a score, but only one atomic
    // updateOne can match `completed: { $ne: true }`. The loser must not
    // return a 200 with a score that was never persisted.
    updateOne.mockResolvedValue({ matchedCount: 0 });

    const req = createMockRequest({ sessionId: "session-1" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Quiz already submitted" });
  });

  it("still rejects up front via the application-level check when completed is already true", async () => {
    findOneSession.mockResolvedValue({
      _id: "session-1",
      userId: "user-123",
      quizId: "quiz-1",
      expiresAt: FUTURE_DATE,
      completed: true,
      answers: { q1: "A", q2: "B" },
    });

    const req = createMockRequest({ sessionId: "session-1" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Quiz already submitted" });
    expect(updateOne).not.toHaveBeenCalled();
  });
});