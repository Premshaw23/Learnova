import { POST } from "./route";
import { checkRateLimit } from "@/lib/rateLimit";

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((body, init) => {
      return {
        status: init?.status || 200,
        json: async () => body,
      };
    }),
  },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

global.fetch = vi.fn();

describe("POST /api/auth/reset-password", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = "mock-firebase-api-key";
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
  });

  const createMockRequest = (bodyData, headers = {}) => {
    return {
      headers: {
        get: (name) => headers[name.toLowerCase()] || null,
      },
      json: vi.fn().mockResolvedValue(bodyData),
    };
  };

  test("returns 400 Bad Request if email is missing", async () => {
    const req = createMockRequest({});
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Email is required");
  });

  test("returns 429 if request is rate limited", async () => {
    checkRateLimit.mockResolvedValue({ allowed: false });

    const req = createMockRequest({ email: "test@example.com" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Too many password reset requests. Please try again later.");
  });

  test("returns success true if Firebase API responds successfully", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ email: "test@example.com", requestType: "PASSWORD_RESET" }),
    });

    const req = createMockRequest({ email: "test@example.com" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("accounts:sendOobCode"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          requestType: "PASSWORD_RESET",
          email: "test@example.com",
        }),
      })
    );
  });

  test("returns success true (preventing user enumeration) if Firebase returns EMAIL_NOT_FOUND", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 400,
          message: "EMAIL_NOT_FOUND",
        },
      }),
    });

    const req = createMockRequest({ email: "notfound@example.com" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
  });

  test("returns non-EMAIL_NOT_FOUND Firebase errors transparently", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 400,
          message: "INVALID_EMAIL",
        },
      }),
    });

    const req = createMockRequest({ email: "invalid-email" });
    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe("INVALID_EMAIL");
  });
});
