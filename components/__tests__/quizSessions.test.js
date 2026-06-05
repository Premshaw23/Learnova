import { POST as quizCreatePOST } from "@/app/api/quiz-sessions/create/route";
import { POST as quizAnswerPOST } from "@/app/api/quiz-sessions/answer/route";
import { POST as quizSubmitPOST } from "@/app/api/quiz-sessions/submit/route";
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
  initFirebaseAdmin: vi.fn(),
}));

vi.mock("@/lib/mongodb", () => {
  const mockCollection = {
    findOne: vi.fn(),
    insertOne: vi.fn().mockResolvedValue({ insertedId: "mock-session-id" }),
    updateOne: vi.fn(),
  };
  const mockDb = {
    collection: vi.fn().mockReturnValue(mockCollection),
  };
  return {
    connectDb: vi.fn().mockResolvedValue(mockDb),
  };
});

describe("Quiz Session API Handlers", () => {
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.LEARNING_DATA_ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  const createMockRequest = (url = "http://localhost", headers = {}, body = null) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer valid-token",
        ...headers,
      })
    );
    const bodyStr = body ? JSON.stringify(body) : "";
    return {
      url,
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      text: async () => bodyStr,
      json: async () => body,
    };
  };

  test("POST /api/quiz-sessions/create: creates a new quiz session", async () => {
    const mockDb = await connectDb();
    mockDb.collection().findOne.mockResolvedValue({
      _id: "quiz-A",
      totalQuestions: 10,
    });

    const req = createMockRequest("http://localhost", {}, { quizId: "quiz-A" });
    const res = await quizCreatePOST(req);

    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.sessionId).toBeDefined();
  });

  test("POST /api/quiz-sessions/answer: records student answer", async () => {
    const mockDb = await connectDb();
    mockDb.collection().findOne.mockImplementation(async (query, options) => {
      // Find session or quiz
      if (query._id === "session-1") {
        return {
          _id: "session-1",
          userId: "student-1",
          quizId: "quiz-1",
          status: "active",
          expiresAt: new Date(Date.now() + 100000),
          completed: false,
        };
      }
      if (query._id === "quiz-1") {
        return {
          _id: "quiz-1",
          questions: [{ _id: "q-1" }],
        };
      }
      return null;
    });

    const req = createMockRequest("http://localhost", {}, { sessionId: "session-1", questionId: "q-1", answer: "A" });
    const res = await quizAnswerPOST(req);

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  test("POST /api/quiz-sessions/submit: grades and completes the session", async () => {
    const mockDb = await connectDb();
    mockDb.collection().findOne.mockImplementation(async (query) => {
      if (query._id === "session-1") {
        return {
          _id: "session-1",
          userId: "student-1",
          quizId: "quiz-1",
          status: "active",
          expiresAt: new Date(Date.now() + 100000),
          completed: false,
          answers: { "0": "A", "1": "B" },
        };
      }
      if (query._id === "quiz-1") {
        return {
          _id: "quiz-1",
          questions: [
            { _id: "0", correctAnswer: "A" },
            { _id: "1", correctAnswer: "C" },
          ],
        };
      }
      return null;
    });

    const req = createMockRequest("http://localhost", {}, { sessionId: "session-1" });
    const res = await quizSubmitPOST(req);

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.score).toBe(1);
    expect(data.totalQuestions).toBe(2);
  });
});
