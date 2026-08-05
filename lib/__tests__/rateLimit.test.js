import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  extractClientIp,
  RATE_LIMIT_IP_FALLBACK,
} from "../rateLimit";

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

describe("extractClientIp", () => {
  const makeHeadersRequest = (headers) => ({
    headers: new Headers(headers),
  });

  const makePlainRequest = (headers) => ({
    headers: { ...headers },
  });

  test("prefers a valid x-real-ip over x-forwarded-for", () => {
    const req = makeHeadersRequest({
      "x-real-ip": "203.0.113.7",
      "x-forwarded-for": "8.8.8.8, 9.9.9.9",
    });
    expect(extractClientIp(req)).toBe("203.0.113.7");
  });

  test("takes the rightmost validated hop from a multi-hop x-forwarded-for", () => {
    const req = makeHeadersRequest({
      "x-forwarded-for": "203.0.113.1, 203.0.113.2, 8.8.8.8",
    });
    expect(extractClientIp(req)).toBe("8.8.8.8");
  });

  test("ignores client-controlled leftmost hops and never rotates the bucket", () => {
    const first = makeHeadersRequest({
      "x-forwarded-for": "1.1.1.1, 8.8.8.8",
    });
    const second = makeHeadersRequest({
      "x-forwarded-for": "2.2.2.2, 8.8.8.8",
    });
    expect(extractClientIp(first)).toBe("8.8.8.8");
    expect(extractClientIp(second)).toBe("8.8.8.8");
  });

  test("rejects private/loopback rightmost hops even if left hops are public", () => {
    const req = makeHeadersRequest({
      "x-forwarded-for": "8.8.8.8, 192.168.1.1",
    });
    expect(extractClientIp(req)).toBeNull();
  });

  test("rejects loopback x-real-ip and falls through to x-forwarded-for", () => {
    const req = makeHeadersRequest({
      "x-real-ip": "127.0.0.1",
      "x-forwarded-for": "203.0.113.9",
    });
    expect(extractClientIp(req)).toBe("203.0.113.9");
  });

  test("rejects reserved IPv6 and documentation ranges", () => {
    expect(
      extractClientIp(makeHeadersRequest({ "x-forwarded-for": "::1" }))
    ).toBeNull();
    expect(
      extractClientIp(makeHeadersRequest({ "x-forwarded-for": "fc00::1" }))
    ).toBeNull();
    expect(
      extractClientIp(
        makeHeadersRequest({ "x-forwarded-for": "2001:db8::1, 2606:4700::1" })
      )
    ).toBe("2606:4700::1");
  });

  test("returns null when the header is missing", () => {
    expect(extractClientIp(makeHeadersRequest({}))).toBeNull();
    expect(extractClientIp(makePlainRequest({}))).toBeNull();
  });

  test("returns null for a request without headers", () => {
    expect(extractClientIp(null)).toBeNull();
    expect(extractClientIp({})).toBeNull();
  });

  test("supports plain-object headers used by middleware/tests", () => {
    const req = makePlainRequest({
      "x-forwarded-for": "10.0.0.1, 203.0.113.44",
    });
    expect(extractClientIp(req)).toBe("203.0.113.44");
  });

  test("exports a fixed sentinel for unresolvable IPs", () => {
    expect(RATE_LIMIT_IP_FALLBACK).toBe("rate-limit-no-ip");
    expect(RATE_LIMIT_IP_FALLBACK.length).toBeGreaterThan(0);
  });
});
