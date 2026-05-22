import { POST } from "@/app/api/groq/route";
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

jest.mock("@/lib/firebase-admin", () => ({
  verifyFirebaseToken: jest.fn(),
}));

global.fetch = jest.fn();

describe("POST /api/groq - Security, Authentication, Rate Limiting, and Timeout Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROQ_API_KEY = "mock-groq-key";
  });

  const createMockRequest = (headers, bodyData) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: jest.fn().mockResolvedValue(bodyData),
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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com" });

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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com" });

    const longMessage = "a".repeat(2001);
    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { message: longMessage }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Message is too long");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("enforces rate limits per authenticated user and returns 429 Too Many Requests", async () => {
    verifyFirebaseToken.mockResolvedValue({ uid: "user-rate-limit-test", email: "user@example.com" });

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-success-test", email: "user@example.com" });

    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
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
    verifyFirebaseToken.mockResolvedValue({ uid: "user-123", email: "user@example.com" });

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
});
