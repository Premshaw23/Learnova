import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSession } from "../sessionManager";
import { getRedis } from "../redis";

vi.mock("../redis", () => ({
  getRedis: vi.fn(),
}));

describe("createSession — atomic single-session-per-user enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("performs the read-terminate-create sequence via a single redis.eval call (no separate smembers/multi round trip)", async () => {
    const evalFn = vi.fn().mockResolvedValue("new-session-id");
    const smembers = vi.fn();
    const multi = vi.fn();
    getRedis.mockReturnValue({ eval: evalFn, smembers, multi });

    await createSession("user-123", { ip: "127.0.0.1" });

    // The old implementation issued a separate smembers() read followed by a
    // multi()/exec() write, leaving a window for a concurrent request to read
    // the same stale state. The fix must do everything in one eval call.
    expect(smembers).not.toHaveBeenCalled();
    expect(multi).not.toHaveBeenCalled();

    expect(evalFn).toHaveBeenCalledTimes(1);
    const [script, keys, args] = evalFn.mock.calls[0];
    expect(typeof script).toBe("string");
    expect(keys).toEqual(["user:sessions:user-123"]);
    expect(args[0]).toEqual(expect.any(String)); // new sessionId
    expect(JSON.parse(args[1])).toEqual(
      expect.objectContaining({ userId: "user-123", ip: "127.0.0.1" })
    );
    expect(args[2]).toBe(String(24 * 60 * 60));
  });

  it("returns the generated sessionId", async () => {
    const evalFn = vi.fn().mockResolvedValue("whatever-the-script-returns");
    getRedis.mockReturnValue({ eval: evalFn });

    const sessionId = await createSession("user-123");

    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);
    // The JS-generated UUID is what's returned to the caller and what's
    // passed into the script as ARGV[1] — not whatever the script itself
    // returns.
    const [, , args] = evalFn.mock.calls[0];
    expect(sessionId).toBe(args[0]);
  });

  it("simulates two concurrent createSession calls against an in-memory fake Redis and ends with exactly one valid session", async () => {
    // A minimal fake Redis that runs the Lua-equivalent logic atomically per
    // call (mirroring what a real Redis server guarantees for EVAL: each
    // invocation runs to completion without interleaving with another).
    const store = new Map(); // key -> Set<string> for sets, or string for plain values
    const ttls = new Map();

    const fakeEval = vi.fn(async (script, keys, args) => {
      const userSessionsKey = keys[0];
      const [newSessionId, sessionData, ttlSeconds] = args;

      const existing = store.get(userSessionsKey) || new Set();
      for (const sid of existing) {
        store.delete(`session:${sid}`);
      }
      store.delete(userSessionsKey);

      store.set(`session:${newSessionId}`, sessionData);
      ttls.set(`session:${newSessionId}`, Number(ttlSeconds));
      store.set(userSessionsKey, new Set([newSessionId]));
      ttls.set(userSessionsKey, Number(ttlSeconds));

      return newSessionId;
    });

    getRedis.mockReturnValue({ eval: fakeEval });

    const [sessionId1, sessionId2] = await Promise.all([
      createSession("user-123", { device: "tab-1" }),
      createSession("user-123", { device: "tab-2" }),
    ]);

    const liveSessionIds = store.get("user:sessions:user-123");
    expect(liveSessionIds.size).toBe(1);

    // Exactly one of the two created sessions should remain live; the other
    // must have been deleted by whichever call ran second.
    const survivor = [...liveSessionIds][0];
    expect([sessionId1, sessionId2]).toContain(survivor);
    const loser = survivor === sessionId1 ? sessionId2 : sessionId1;
    expect(store.has(`session:${loser}`)).toBe(false);
    expect(store.has(`session:${survivor}`)).toBe(true);
  });

  it("returns the bypass session id without touching redis when env vars are missing", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const evalFn = vi.fn();
    getRedis.mockReturnValue({ eval: evalFn });

    const sessionId = await createSession("user-123");

    expect(sessionId).toBe("local-bypass-session");
    expect(evalFn).not.toHaveBeenCalled();
  });
});