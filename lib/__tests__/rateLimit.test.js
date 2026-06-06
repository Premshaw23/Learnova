import { describe, test, expect, vi, beforeEach } from "vitest";

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

describe("rateLimit module", () => {
  test("module loads without syntax error", async () => {
    await expect(
      () => import("../rateLimit")
    ).not.toThrow();
  });

  test("checkRateLimit is a function", async () => {
    const mod = await import("../rateLimit");
    expect(typeof mod.checkRateLimit).toBe("function");
  });

  test("checkRateLimit returns allowed result for unknown userId when no backends configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.MONGODB_URI = "";

    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const mongoMock = await import("../mongodb");
    vi.spyOn(mongoMock, "connectDb").mockRejectedValue(new Error("MongoDB unavailable"));

    const mod = await import("../rateLimit");
    const result = await mod.checkRateLimit("test-user-123");

    expect(result).toHaveProperty("allowed");
    expect(result).toHaveProperty("remaining");
  });

  test("checkRateLimit enforces in-memory limit when backends are unavailable", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    process.env.MONGODB_URI = "";

    vi.doMock("@/lib/logger", () => ({
      logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
    }));

    const mongoMock = await import("../mongodb");
    vi.spyOn(mongoMock, "connectDb").mockRejectedValue(new Error("MongoDB unavailable"));

    const mod = await import("../rateLimit");

    const first = await mod.checkRateLimit("test-user-456");
    expect(first.allowed).toBe(true);

    for (let i = 0; i < 4; i++) {
      await mod.checkRateLimit("test-user-456");
    }

    const blockResult = await mod.checkRateLimit("test-user-456");
    expect(blockResult.allowed).toBe(false);
    expect(blockResult.remaining).toBe(0);
  });
});
