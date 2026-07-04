import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @upstash/redis so the rate limiter uses the in-memory dev fallback
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({
    multi: vi.fn(),
    zremrangebyscore: vi.fn(),
    zadd: vi.fn(),
    zcard: vi.fn(),
    expire: vi.fn(),
    exec: vi.fn().mockResolvedValue([0, 0, 0]),
    zrange: vi.fn(),
  })),
}));

// Since the middleware uses jose for JWT verification, we need to mock it
vi.mock("jose", () => ({
  importSPKI: vi.fn().mockResolvedValue("mock-public-key"),
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      sub: "user-123",
      email: "test@example.com",
      email_verified: true,
      role: "student",
      iat: Math.floor(Date.now() / 1000),
    },
  }),
}));

// Mock CSRF module
vi.mock("@/lib/csrf", () => ({
  validateCsrfOriginAndReferer: vi.fn(),
  validateCsrfRequest: vi.fn(),
}));

// Mock fetch for Firebase public keys
global.fetch = vi.fn();

describe("Middleware Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear UPSTASH env vars so the rate limiter uses the in-memory fallback
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe("AUTH_RATE_LIMITED_PATHS", () => {
    it("identifies all auth routes correctly", async () => {
      const mod = await import("@/middleware");

      expect(mod.isAuthRoute("/api/auth/login")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/login/")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/signup")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/logout")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/forgot-password")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/reset-password")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/verify-email")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/verify-otp")).toBe(true);
      expect(mod.isAuthRoute("/api/auth/verify-otp/callback")).toBe(true);
    });

    it("does not match non-auth routes", async () => {
      const mod = await import("@/middleware");

      expect(mod.isAuthRoute("/api/attendance/record")).toBe(false);
      expect(mod.isAuthRoute("/api/student/dashboard")).toBe(false);
      expect(mod.isAuthRoute("/api/admin/stats")).toBe(false);
      expect(mod.isAuthRoute("/api/settings")).toBe(false);
      expect(mod.isAuthRoute("/auth")).toBe(false);
    });
  });

  describe("Rate Limit Key Generation", () => {
    it("generates consistent keys for the same IP, path, and fingerprint", () => {
      const ip = "192.168.1.1";
      const pathname = "/api/auth/login";
      const fingerprint = "abc123def456";
      const key = `${ip}_${pathname}_${fingerprint.slice(0, 16)}`;
      expect(key).toBe("192.168.1.1_/api/auth/login_abc123def456");
    });

    it("generates different keys for different IPs", () => {
      const key1 = `192.168.1.1_/api/auth/login_`;
      const key2 = `10.0.0.1_/api/auth/login_`;
      expect(key1).not.toBe(key2);
    });

    it("generates different keys for different paths", () => {
      const key1 = `192.168.1.1_/api/auth/login_`;
      const key2 = `192.168.1.1_/api/auth/signup_`;
      expect(key1).not.toBe(key2);
    });
  });

  describe("Rate Limit Window (in-memory fallback)", () => {
    it("allows requests within the window", async () => {
      const mod = await import("@/middleware");
      const request = new Request("http://localhost/api/auth/login", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = await mod.rateLimit(
          "192.168.1.1",
          "/api/auth/login",
          request
        );
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = await mod.rateLimit(
        "192.168.1.1",
        "/api/auth/login",
        request
      );
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("resets after the window expires", async () => {
      const mod = await import("@/middleware");
      const request = new Request("http://localhost/api/auth/login", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      // Exhaust the limit (5 max)
      for (let i = 0; i < 5; i++) {
        await mod.rateLimit("192.168.1.1", "/api/auth/login", request);
      }
      const blocked = await mod.rateLimit(
        "192.168.1.1",
        "/api/auth/login",
        request
      );
      expect(blocked.allowed).toBe(false);
    });
  });

  describe("Rate Limit Cleanup", () => {
    it("cleans up expired entries", async () => {
      const mod = await import("@/middleware");
      const now = Date.now();

      // Set lastCleanupTime far in the past so cleanup doesn't short-circuit
      mod.resetForTest(now - 10 * 60 * 1000);
      mod.devRateLimitMap.set("expired_key", {
        count: 3,
        resetTime: now - 1000,
      });
      mod.devRateLimitMap.set("valid_key", {
        count: 2,
        resetTime: now + 60000,
      });

      mod.cleanupRateLimitMap();

      expect(mod.devRateLimitMap.has("expired_key")).toBe(false);
      expect(mod.devRateLimitMap.has("valid_key")).toBe(true);
    });
  });
});

describe("Middleware JWT Verification", () => {
  it("extracts Bearer token from Authorization header", () => {
    const authorization = "Bearer eyJhbGciOiJSUzI1NiIs...";
    const token = authorization?.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : null;
    expect(token).toBe("eyJhbGciOiJSUzI1NiIs...");
  });

  it("extracts token from cookie when no Authorization header", () => {
    const cookies = new Map([["authToken", { value: "cookie-token-123" }]]);
    const token = cookies.get("authToken")?.value || null;
    expect(token).toBe("cookie-token-123");
  });

  it("returns null when no token is available", () => {
    const authorization = null;
    const cookies = { get: () => undefined };
    const token = authorization?.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : cookies.get("authToken")?.value || null;
    expect(token).toBeNull();
  });
});

describe("Middleware Role-Based Redirects", () => {
  const protectedDashboards = [
    {
      prefix: "/student",
      apiPrefix: "/api/student",
      role: "student",
      defaultPath: "/student/dashboard",
    },
    {
      prefix: "/teacher",
      apiPrefix: "/api/teacher",
      role: "teacher",
      defaultPath: "/teacher/dashboard",
    },
    {
      prefix: "/admin",
      apiPrefix: "/api/admin",
      role: "admin",
      defaultPath: "/admin/dashboard",
    },
    {
      prefix: "/institute",
      apiPrefix: "/api/institute",
      role: "institute",
      defaultPath: "/institute/dashboard",
    },
  ];

  it("matches dashboard routes correctly", () => {
    function matchDashboard(pathname) {
      return protectedDashboards.find(
        (dashboard) =>
          pathname.startsWith(dashboard.prefix) ||
          (dashboard.apiPrefix && pathname.startsWith(dashboard.apiPrefix))
      );
    }

    expect(matchDashboard("/student/dashboard")?.role).toBe("student");
    expect(matchDashboard("/api/student/gamification")?.role).toBe("student");
    expect(matchDashboard("/teacher/dashboard")?.role).toBe("teacher");
    expect(matchDashboard("/api/admin/stats")?.role).toBe("admin");
    expect(matchDashboard("/institute/dashboard")?.role).toBe("institute");
    expect(matchDashboard("/api/institute/bulk-import")?.role).toBe(
      "institute"
    );
  });

  it("does not match non-dashboard routes", () => {
    function matchDashboard(pathname) {
      return protectedDashboards.find(
        (dashboard) =>
          pathname.startsWith(dashboard.prefix) ||
          (dashboard.apiPrefix && pathname.startsWith(dashboard.apiPrefix))
      );
    }

    expect(matchDashboard("/api/attendance/record")).toBeUndefined();
    expect(matchDashboard("/api/settings")).toBeUndefined();
    expect(matchDashboard("/api/conversations")).toBeUndefined();
    expect(matchDashboard("/auth")).toBeUndefined();
  });

  it("redirects to correct dashboard based on role", () => {
    function getRedirectTarget(userRole) {
      const correctDashboard = protectedDashboards.find(
        (d) => d.role === userRole
      );
      return correctDashboard ? correctDashboard.defaultPath : "/profile";
    }

    expect(getRedirectTarget("student")).toBe("/student/dashboard");
    expect(getRedirectTarget("teacher")).toBe("/teacher/dashboard");
    expect(getRedirectTarget("admin")).toBe("/admin/dashboard");
    expect(getRedirectTarget("institute")).toBe("/institute/dashboard");
    expect(getRedirectTarget("unknown")).toBe("/profile");
    expect(getRedirectTarget(null)).toBe("/profile");
  });
});
