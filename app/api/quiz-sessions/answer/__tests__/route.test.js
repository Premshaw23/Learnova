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

describe("POST /api/quiz-sessions/answer — completion race guard", () => {
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
      answers: {},
    });

    findOneQuiz = vi.fn().mockResolvedValue({
      _id: "quiz-1",
      questions: [{ _id: "q1", correctAnswer: "A" }],
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
    const req = createMockRequest({
      sessionId: "session-1",
      questionId: "q1",
      answer: "A",
    });

    await POST(req);

    expect(updateOne).toHaveBeenCalledWith(
      { _id: "session-1", completed: { $ne: true } },
      expect.objectContaining({ $set: expect.any(Object) })
    );
  });

  it("records the answer successfully when the session is still open", async () => {
    const req = createMockRequest({
      sessionId: "session-1",
      questionId: "q1",
      answer: "A",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ success: true, message: "Answer recorded" });
  });

  it("rejects with 'Quiz already submitted' if the session was completed concurrently (matchedCount 0)", async () => {
    // Simulates the TOCTOU race: the application-level `session.completed`
    // read-check passed (false), but a concurrent /submit call completed the
    // session between the read and this write, so the atomic filter no
    // longer matches.
    updateOne.mockResolvedValue({ matchedCount: 0 });

    const req = createMockRequest({
      sessionId: "session-1",
      questionId: "q1",
      answer: "A",
    });

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
      answers: {},
    });

    const req = createMockRequest({
      sessionId: "session-1",
      questionId: "q1",
      answer: "A",
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Quiz already submitted" });
    expect(updateOne).not.toHaveBeenCalled();
  });
});