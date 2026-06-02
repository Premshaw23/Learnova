import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { detectInjection } from "@/utils/promptGuard";
import { AppError } from "@/lib/errors";
import { POST } from "@/app/api/conversations/route";

vi.mock("groq-sdk", () => {
  return {
    Groq: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              [Symbol.asyncIterator]: async function* () {
                yield { choices: [{ delta: { content: "Hello" } }] };
              },
            }),
          },
        },
      };
    }),
  };
});

vi.mock("groq-sdk", () => {
  return {
    Groq: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue((async function* () {
              yield { choices: [{ delta: { content: "Mocked response" } }] };
            })()),
          },
        },
      };
    }),
  };
});

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock("@/utils/promptGuard", () => ({
  detectInjection: vi.fn(),
  sanitizeMessage: vi.fn((msg) => msg),
  buildSecureMessages: vi.fn((userMessage, baseSystemPrompt, history = []) => [
    { role: "system", content: baseSystemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ]),
}));

vi.mock("groq-sdk", () => {
  return {
    Groq: vi.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              [Symbol.asyncIterator]: async function* () {
                yield { choices: [{ delta: { content: "Mock response" } }] };
              },
            }),
          },
        },
      };
    }),
  };
});

vi.mock("@/services/ai-agent/intentparser", () => ({
  parseUserIntent: vi.fn().mockResolvedValue(null),
}));

const createMockRequest = (headers, body) => ({
  headers: {
    get: (name) => headers[name.toLowerCase()] || null,
  },
  json: vi.fn().mockResolvedValue(body),
  text: vi.fn().mockResolvedValue(JSON.stringify(body)),
});

describe("POST /api/conversations - Auth Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockReset();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    detectInjection.mockReturnValue({ isInjection: false });
  });

  test("rejects unauthenticated request with 401 when requireAuth throws", async () => {
    requireAuth.mockRejectedValue(new AppError("Unauthorized", 401));

    const req = createMockRequest({}, { messages: [{ text: "Hello" }] });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("rejects request with invalid auth token", async () => {
    requireAuth.mockRejectedValue(new AppError("Unauthorized", 401));

    const req = createMockRequest(
      { authorization: "Bearer invalid-token" },
      { messages: [{ text: "Hello" }] }
    );
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Unauthorized");
  });

  test("accepts valid authenticated request", async () => {
    requireAuth.mockResolvedValue({ uid: "user-123", sub: "user-123" });
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    detectInjection.mockReturnValue({ isInjection: false });

    const req = createMockRequest(
      { authorization: "Bearer valid-token" },
      { messages: [{ role: "user", content: "Hello" }] }
    );
    const response = await POST(req);

    expect(response.status).toBe(200);
  });
});
