import { POST } from "@/app/api/groq/route";
import { verifyFirebaseToken } from "@/lib/firebase-admin";
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

vi.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

global.fetch = vi.fn();

describe("POST /api/groq - Security, Authentication, Rate Limiting, and Timeout Tests", () => {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterAll(() => {
    console.warn.mockRestore();
    console.log.mockRestore();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GROQ_API_KEY = "mock-groq-key";
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
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

  test("rejects unauthenticated request (no authorization header) with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest({}, { message: "Hello Nova" });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rejects request with invalid token with 401 Unauthorized", async () => {
    verifyFirebaseToken.mockResolvedValue(null);

    const req = createMockRequest(
      { authorization: "Bearer invalid-token" },
      { message: "Hello Nova" }
    );

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rejects missing message input with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Message is required");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("rejects over-length messages with 400 Bad Request", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });

    const longMessage = "a".repeat(2001);
    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: longMessage }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Message too long (max 2000 characters)");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("enforces rate limits per authenticated user and returns 429 Too Many Requests", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-rate-limit-test", email: "user@example.com", email_verified: true });

    checkRateLimit
      .mockResolvedValueOnce({ allowed: true, remaining: 9 })
      .mockResolvedValueOnce({ allowed: true, remaining: 8 })
      .mockResolvedValueOnce({ allowed: true, remaining: 7 })
      .mockResolvedValueOnce({ allowed: true, remaining: 6 })
      .mockResolvedValueOnce({ allowed: true, remaining: 5 })
      .mockResolvedValueOnce({ allowed: true, remaining: 4 })
      .mockResolvedValueOnce({ allowed: true, remaining: 3 })
      .mockResolvedValueOnce({ allowed: true, remaining: 2 })
      .mockResolvedValueOnce({ allowed: true, remaining: 1 })
      .mockResolvedValueOnce({ allowed: true, remaining: 0 })
      .mockResolvedValueOnce({ allowed: false, remaining: 0 });

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "AI response" } }],
      }),
    });

    // Make 10 requests which is the max allowed
    for (let i = 0; i < 10; i++) {
      const req = createMockRequest(
        { authorization: "Bearer valid-token" },
        { message: `Request ${i}` }
      );
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // The 11th request must be rate limited (429)
    const req11 = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "Request 11" }
    );
    const response = await POST(req11);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("Too many requests. Please try again later.");
  });

  test("successfully resolves Groq call for authenticated, non-rate-limited requests", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-success-test", email: "user@example.com", email_verified: true });

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Nova's warm response!" } }],
      }),
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "Help me with attendance automation" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe("Nova's warm response!");
    expect(global.fetch).toHaveBeenCalled();
  });

  test("aborts the request and returns 504 Gateway Timeout when Groq API hangs/exceeds timeout", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com", email_verified: true });

    // Mock fetch to simulate an AbortError being thrown
    global.fetch.mockImplementation(() => {
      const error = new Error("The user aborted a request.");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "This request will time out" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(504);
    expect(body.error).toBe("Gateway Timeout: Groq did not respond in time.");
    expect(global.fetch).toHaveBeenCalled();
  });

  test("maps Groq upstream error payload to API error response", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-upstream-error", email: "user@example.com", email_verified: true });

    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({
        error: { message: "Upstream quota exceeded" },
      }),
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "Trigger upstream error" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toBe("Upstream quota exceeded");
  });

  test("uses fallback message when Groq upstream error body is invalid", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-upstream-invalid-json", email: "user@example.com", email_verified: true });

    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: "Trigger upstream parse fallback" }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe("Groq API request failed");
  });

  test("accepts messages array format and extracts last user message", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-msg-array", email: "user@example.com", email_verified: true });

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: "Response with history" } }],
      }),
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        messages: [
          { role: "user", content: "What is attendance?" },
          { role: "assistant", content: "Attendance is..." },
          { role: "user", content: "Tell me more" },
        ],
      }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe("Response with history");
  });

  test("rejects messages array with no user role entries as missing input", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-no-user-msg", email: "user@example.com", email_verified: true });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        messages: [
          { role: "assistant", content: "Hello" },
        ],
      }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Message is required");
  });

  test("passes conversation history to Groq API request", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-history-check", email: "user@example.com", email_verified: true });

    let fetchBody;
    global.fetch.mockImplementation((url, options) => {
      fetchBody = JSON.parse(options.body);
      return Promise.resolve({
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Response with memory" } }],
        }),
      });
    });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      {
        messages: [
          { role: "user", content: "My name is Alice" },
          { role: "assistant", content: "Nice to meet you Alice!" },
          { role: "user", content: "What is my name?" },
        ],
      }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe("Response with memory");

    const userMessages = fetchBody.messages.filter(m => m.role === "user");
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0].content).toBe("My name is Alice");
    expect(userMessages[1].content).toBe("What is my name?");

    const assistantMessages = fetchBody.messages.filter(m => m.role === "assistant");
    expect(assistantMessages).toHaveLength(1);
    expect(assistantMessages[0].content).toBe("Nice to meet you Alice!");
  });
});
