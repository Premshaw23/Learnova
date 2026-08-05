import { describe, test, expect, vi, beforeEach } from "vitest";

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("ssePublisher", () => {
  test("publishEvent and pollEvents work via the in-memory fallback", async () => {
    const mod = await import("../ssePublisher");

    await mod.publishEvent("notifications", "notification", {
      recipientId: "u1",
      message: "hello",
    });
    await mod.publishEvent("notifications", "notification", {
      recipientId: "u1",
      message: "world",
    });

    const events = await mod.pollEvents("notifications", 0);
    expect(events).toHaveLength(2);
    expect(events[0].payload.message).toBe("hello");
    expect(events[1].payload.message).toBe("world");
    expect(events[0]._sequence).toBe(1);
    expect(events[1]._sequence).toBe(2);
  });

  test("pollEvents sinceSequence filters previously seen events", async () => {
    const mod = await import("../ssePublisher");

    await mod.publishEvent("notifications", "notification", { n: 1 });
    await mod.publishEvent("notifications", "notification", { n: 2 });
    await mod.publishEvent("notifications", "notification", { n: 3 });

    const events = await mod.pollEvents("notifications", 1);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.payload.n)).toEqual([2, 3]);
  });

  test("channels are isolated from one another", async () => {
    const mod = await import("../ssePublisher");

    await mod.publishEvent("notifications", "notification", { kind: "n" });
    await mod.publishEvent("attendance", "attendance", { kind: "a" });
    await mod.publishEvent("polls", "polls", { kind: "p" });

    const notifications = await mod.pollEvents("notifications", 0);
    const attendance = await mod.pollEvents("attendance", 0);
    const polls = await mod.pollEvents("polls", 0);

    expect(notifications.map((e) => e.payload.kind)).toEqual(["n"]);
    expect(attendance.map((e) => e.payload.kind)).toEqual(["a"]);
    expect(polls.map((e) => e.payload.kind)).toEqual(["p"]);
  });

  test("channels use independent sequence namespaces", async () => {
    const mod = await import("../ssePublisher");

    // Simulate heavy notification traffic that would inflate a shared counter.
    for (let i = 0; i < 10; i++) {
      await mod.publishEvent("notifications", "notification", { seq: i });
    }
    await mod.publishEvent("attendance", "attendance", { seq: 1 });

    // The attendance event must carry its own channel-local sequence (1),
    // not a global counter inflated by notification traffic (11).
    const attendance = await mod.pollEvents("attendance", 0);
    expect(attendance).toHaveLength(1);
    expect(attendance[0].payload.seq).toBe(1);
    expect(attendance[0]._sequence).toBe(1);

    const notifications = await mod.pollEvents("notifications", 0);
    expect(notifications).toHaveLength(10);
    expect(notifications[9]._sequence).toBe(10);
  });

  test("pollEvents respects the requested limit", async () => {
    const mod = await import("../ssePublisher");

    for (let i = 0; i < 5; i++) {
      await mod.publishEvent("notifications", "notification", { seq: i });
    }

    const events = await mod.pollEvents("notifications", 0, 2);
    expect(events).toHaveLength(2);
  });
});
