import { describe, test, expect, vi, beforeEach } from "vitest";
import { SESSION_TTL_SECONDS } from "@/lib/sessionConstants";

vi.mock("@/lib/error-handler", () => ({
  withErrorHandler: (handler) => handler,
}));

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/sessionManager", () => ({
  createSession: vi.fn().mockResolvedValue("session-abc"),
  terminateSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/server", () => {
  class FakeNextResponse {
    constructor(body, init = {}) {
      this.status = init.status ?? 200;
      this._body = body;
      this.cookies = {
        _store: new Map(),
        set(name, value, options = {}) {
          this._store.set(name, { value, ...options });
        },
        get(name) {
          return this._store.get(name);
        },
      };
    }
    async json() {
      return this._body;
    }
  }

  return {
    NextResponse: {
      json: (body, init = {}) => new FakeNextResponse(body, init),
    },
  };
});

describe("auth session route — cookie/Redis TTL alignment", () => {
  const createMockRequest = (headers = {}, cookies = {}) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        authorization: "Bearer test-token",
        ...headers,
      })
    );
    return {
      headers: { get: (key) => headersMap.get(key.toLowerCase()) || null },
      cookies: { get: (key) => cookies[key] || null },
    };
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { requireAuth } = await import("@/lib/rbac");
    requireAuth.mockResolvedValue({ uid: "user-123" });
  });

  test("the authToken and sessionId cookie maxAge equal SESSION_TTL_SECONDS — the same constant used for the Redis session TTL", async () => {
    const { POST } = await import("../route");

    const response = await POST(createMockRequest());

    const authCookie = response.cookies.get("authToken");
    const sessionCookie = response.cookies.get("sessionId");

    expect(authCookie.maxAge).toBe(SESSION_TTL_SECONDS);
    expect(sessionCookie.maxAge).toBe(SESSION_TTL_SECONDS);

    // Guard against the regression this fixes: a previous independent
    // literal (60 * 60 = 1h) would no longer match the 24h Redis TTL.
    expect(authCookie.maxAge).not.toBe(60 * 60);
  });

  test("createSession (which persists to Redis with SESSION_TTL_SECONDS) is invoked once per POST", async () => {
    const { POST } = await import("../route");
    const { createSession } = await import("@/lib/sessionManager");

    await POST(createMockRequest());

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledWith(
      "user-123",
      expect.objectContaining({ ip: "127.0.0.1" })
    );
  });
});