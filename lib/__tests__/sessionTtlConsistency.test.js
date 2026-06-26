import { describe, expect, it, vi, beforeEach } from "vitest";
import { SESSION_TTL_SECONDS } from "../sessionConstants";
import { createSession } from "../sessionManager";
import { getRedis } from "../redis";

vi.mock("../redis", () => ({
  getRedis: vi.fn(),
}));

describe("Session TTL consistency between auth cookies and Redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("passes SESSION_TTL_SECONDS as the Redis session TTL in createSession's eval call", async () => {
    const evalFn = vi.fn().mockResolvedValue("session-id");
    getRedis.mockReturnValue({ eval: evalFn });

    await createSession("user-123");

    const [, , args] = evalFn.mock.calls[0];
    const ttlArg = Number(args[2]);

    expect(ttlArg).toBe(SESSION_TTL_SECONDS);
  });

  it("SESSION_TTL_SECONDS is a positive integer number of seconds (sanity check on the shared constant itself)", () => {
    expect(Number.isInteger(SESSION_TTL_SECONDS)).toBe(true);
    expect(SESSION_TTL_SECONDS).toBeGreaterThan(0);
  });
});