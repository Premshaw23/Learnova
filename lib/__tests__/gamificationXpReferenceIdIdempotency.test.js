import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => {
    throw new Error("Firestore unavailable in test");
  }),
}));

vi.mock("@/lib/lockManager", () => {
  const queues = new Map();
  return {
    withLock: vi.fn((resource, fn) => {
      const previous = queues.get(resource) || Promise.resolve();
      const next = previous.then(() => fn(), () => fn());
      queues.set(
        resource,
        next.catch(() => {})
      );
      return next;
    }),
  };
});

function createFakeUsersCollection(initialDoc) {
  let doc = initialDoc;
  return {
    findOne: vi.fn(async () => doc),
    updateOne: vi.fn(async (filter, update) => {
      if (!doc) {
        doc = { ...update.$setOnInsert, ...update.$set };
        return { matchedCount: 0, upsertedCount: 1 };
      }
      doc = { ...doc, ...update.$set };
      return { matchedCount: 1, upsertedCount: 0 };
    }),
    createIndex: vi.fn().mockResolvedValue({}),
  };
}

function createFakeXpAwardsCollection() {
  const awarded = new Set();
  return {
    findOne: vi.fn(async (query) => {
      const key = `${query.firebaseUid}:${query.actionType}:${query.referenceId}`;
      return awarded.has(key) ? { ...query } : null;
    }),
    updateOne: vi.fn(async (filter) => {
      const key = `${filter.firebaseUid}:${filter.actionType}:${filter.referenceId}`;
      const alreadyExisted = awarded.has(key);
      awarded.add(key);
      return alreadyExisted
        ? { matchedCount: 1, upsertedCount: 0 }
        : { matchedCount: 0, upsertedCount: 1 };
    }),
    createIndex: vi.fn().mockResolvedValue({}),
  };
}

describe("awardXp idempotency — referenceId guard for non-attendance action types", () => {
  let usersCollection;
  let xpAwardsCollection;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    usersCollection = createFakeUsersCollection({
      firebaseUid: "student-1",
      totalXp: 0,
      currentLevel: 1,
      xpToNextLevel: 100,
      currentStreak: 0,
      unlockedBadges: [],
      attendanceHistory: [],
      version: 0,
      createdAt: "2026-06-01T00:00:00.000Z",
    });
    xpAwardsCollection = createFakeXpAwardsCollection();

    vi.doMock("@/lib/mongodb", () => ({
      connectDb: vi.fn().mockResolvedValue({
        collection: vi.fn((name) => {
          if (name === "users") return usersCollection;
          if (name === "xp_awards") return xpAwardsCollection;
          throw new Error(`Unexpected collection requested: ${name}`);
        }),
      }),
    }));
  });

  test("a retried focus_session_completed call with the same referenceId only credits XP once", async () => {
    const { awardXp } = await import("../gamification-service");

    const metadata = { referenceId: "pomodoro-session-abc" };

    const firstResult = await awardXp(
      "student-1",
      "focus_session_completed",
      metadata
    );
    const secondResult = await awardXp(
      "student-1",
      "focus_session_completed",
      metadata
    );

    expect(firstResult.xpAwarded).toBeGreaterThan(0);
    expect(secondResult.xpAwarded).toBe(0);
    expect(secondResult.reason).toBe("already_recorded");
    expect(secondResult.totalXp).toBe(firstResult.totalXp);
    expect(xpAwardsCollection.updateOne).toHaveBeenCalledTimes(1);
  });

  test("different referenceIds for the same action type are not treated as duplicates", async () => {
    const { awardXp } = await import("../gamification-service");

    const sessionOne = await awardXp("student-1", "focus_session_completed", {
      referenceId: "pomodoro-session-1",
    });
    const sessionTwo = await awardXp("student-1", "focus_session_completed", {
      referenceId: "pomodoro-session-2",
    });

    expect(sessionOne.xpAwarded).toBeGreaterThan(0);
    expect(sessionTwo.xpAwarded).toBeGreaterThan(0);
    expect(sessionTwo.totalXp).toBe(sessionOne.totalXp + sessionTwo.xpAwarded);
  });

  test("without a referenceId, non-attendance action types are awarded every call (unchanged legacy behavior)", async () => {
    const { awardXp } = await import("../gamification-service");

    const first = await awardXp("student-1", "quiz_passed", {});
    const second = await awardXp("student-1", "quiz_passed", {});

    expect(first.xpAwarded).toBeGreaterThan(0);
    expect(second.xpAwarded).toBeGreaterThan(0);
    expect(xpAwardsCollection.updateOne).not.toHaveBeenCalled();
  });
});