import { describe, expect, test, beforeEach, vi } from "vitest";
import { checkRateLimit, RATE_LIMIT_POLICIES } from "../rateLimit";
import { connectDb } from "../mongodb";

vi.mock("../mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("Central Rate Limiter Dynamic Policies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Force Mongo to fail so we consistently test the in-memory fallback engine in isolated unit tests
    connectDb.mockRejectedValue(new Error("Mongo connection failed"));
  });

  test("enforces backward compatibility under database fallback conditions: defaults to 3 requests per minute", async () => {
    const userId = "compat-user-123";

    // 3 successful requests allowed under fallback
    for (let i = 0; i < 3; i++) {
      const res = await checkRateLimit(userId);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(2 - i);
    }

    // 4th request blocked
    const resBlocked = await checkRateLimit(userId);
    expect(resBlocked.allowed).toBe(false);
    expect(resBlocked.remaining).toBe(0);
  });

  test("applies custom policy options dynamically", async () => {
    const userId = "custom-user-123";
    const customPolicy = { maxRequests: 3, windowMs: 1000, fallbackMax: 2 };

    // Allows up to fallbackMax (2) requests under database fallback conditions
    let res = await checkRateLimit(userId, customPolicy);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(1);

    res = await checkRateLimit(userId, customPolicy);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);

    // 3rd attempt is blocked under fallbackMax=2 restriction
    res = await checkRateLimit(userId, customPolicy);
    expect(res.allowed).toBe(false);
    expect(res.remaining).toBe(0);
  });

  test("integrates RATE_LIMIT_POLICIES registries correctly", async () => {
    const userId = "registry-user-123";
    const policy = RATE_LIMIT_POLICIES.RESET_PASSWORD; // maxRequests: 3, windowMs: 15 mins

    // Under fallback, fallbackMax = Math.max(1, Math.min(Math.floor(3 * 0.3), 3)) = 1
    let res = await checkRateLimit(userId, policy);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(0);

    res = await checkRateLimit(userId, policy);
    expect(res.allowed).toBe(false);
  });
});
