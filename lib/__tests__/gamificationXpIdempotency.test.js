import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => {
    throw new Error("Firestore unavailable in test");
  }),
}));

// No Upstash env vars are set in this test file. lib/lockManager.js's
// withLock() is mocked below to serialize calls per resource key — this is
// what the real Redis-backed distributed lock (SET NX) guarantees in
// production. Without mocking it, withLock() would bypass to a no-op here
// (no Redis configured), and a Promise.all of two awardXp calls would race
// past the in-memory fake Mongo collections with nothing serializing them —
// which wouldn't actually exercise the application's idempotency guarantee.
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
  // Mirrors the unique index on { firebaseUid, actionType, date } described
  // in lib/gamification-service.js: a second insert for the same key is a
  // safe no-op (the real unique-index violation is caught and ignored).
  const awarded = new Set();
  return {
    findOne: vi.fn(async (query) => {
      const key = `${query.firebaseUid}:${query.actionType}:${query.date}`;
      return awarded.has(key) ? { ...query } : null;
    }),
    updateOne: vi.fn(async (filter) => {
      const key = `${filter.firebaseUid}:${filter.actionType}:${filter.date}`;
      const alreadyExisted = awarded.has(key);
      awarded.add(key);
      return alreadyExisted
        ? { matchedCount: 1, upsertedCount: 0 }
        : { matchedCount: 0, upsertedCount: 1 };
    }),
    createIndex: vi.fn().mockResolvedValue({}),
  };
}

describe("awardXp idempotency — prevents double-crediting attendance XP for the same user/date", () => {
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

  test("two awardXp calls for the same (uid, attendance_marked, date) only credit XP once — second call is a no-op", async () => {
    const { awardXp } = await import("../gamification-service");

    const attendanceDate = "2026-06-25";
    const metadata = { attendanceHour: 9, attendanceDate };

    // Simulates the scenario described in the bug report: one call
    // representing the synchronous/direct award, and a second representing
    // the queue worker (handleAwardGamificationXp) processing the
    // corresponding enqueued job for the very same attendance event.
    const firstResult = await awardXp("student-1", "attendance_marked", metadata);
    const secondResult = await awardXp("student-1", "attendance_marked", metadata);

    expect(firstResult.xpAwarded).toBeGreaterThan(0);
    expect(firstResult.reason).toBeUndefined();

    expect(secondResult.xpAwarded).toBe(0);
    expect(secondResult.reason).toBe("already_recorded");

    // The student's persisted totalXp must reflect exactly one award, not two.
    expect(secondResult.totalXp).toBe(firstResult.totalXp);

    // The xp_awards guard write only happens on the successful award; the
    // second, duplicate call short-circuits earlier (via the existingAward
    // findOne check) and never reaches updateOne.
    expect(xpAwardsCollection.updateOne).toHaveBeenCalledTimes(1);
  });

  test("two concurrent awardXp calls for the same (uid, attendance_marked, date) still only credit XP once", async () => {
    const { awardXp } = await import("../gamification-service");

    const attendanceDate = "2026-06-25";
    const metadata = { attendanceHour: 9, attendanceDate };

    const [resultA, resultB] = await Promise.all([
      awardXp("student-1", "attendance_marked", metadata),
      awardXp("student-1", "attendance_marked", metadata),
    ]);

    const results = [resultA, resultB];
    const awardedCount = results.filter((r) => r.xpAwarded > 0).length;
    const noOpCount = results.filter((r) => r.reason === "already_recorded").length;

    expect(awardedCount).toBe(1);
    expect(noOpCount).toBe(1);
  });

  test("awardXp calls for different attendance dates are not treated as duplicates", async () => {
    const { awardXp } = await import("../gamification-service");

    const dayOne = await awardXp("student-1", "attendance_marked", {
      attendanceHour: 9,
      attendanceDate: "2026-06-24",
    });
    const dayTwo = await awardXp("student-1", "attendance_marked", {
      attendanceHour: 9,
      attendanceDate: "2026-06-25",
    });

    expect(dayOne.xpAwarded).toBeGreaterThan(0);
    expect(dayTwo.xpAwarded).toBeGreaterThan(0);
    expect(dayTwo.reason).toBeUndefined();
  });

  test("regression: a string attendanceDate (as produced by getLocalDateKey in the offline-sync path) does not crash on a student's second attendance award", async () => {
    // Previously, lib/gamification-service.js called .getFullYear() (inside
    // processStreak -> daysBetween) and .toISOString() directly on
    // metadata.attendanceDate, assuming it was always a Date instance. But
    // app/api/attendance/sync/route.js always passes a "YYYY-MM-DD" string
    // (from getLocalDateKey()). On a student's first-ever award this was
    // masked because processStreak short-circuits when there's no prior
    // lastAttendanceDate — but a second award on a consecutive day threw
    // `TypeError: ... is not a function`, causing the queued
    // AWARD_GAMIFICATION_XP job to fail and retry without ever crediting XP.
    const { awardXp } = await import("../gamification-service");

    const dayOne = await awardXp("student-1", "attendance_marked", {
      attendanceHour: 9,
      attendanceDate: "2026-06-24",
    });

    await expect(
      awardXp("student-1", "attendance_marked", {
        attendanceHour: 9,
        attendanceDate: "2026-06-25",
      })
    ).resolves.toEqual(
      expect.objectContaining({
        xpAwarded: expect.any(Number),
        currentStreak: 2,
      })
    );

    expect(dayOne.currentStreak).toBe(1);
  });

  test("awardXp accepts a Date instance for attendanceDate (legacy/online-style callers) as well as a string", async () => {
    const { awardXp } = await import("../gamification-service");

    const result = await awardXp("student-1", "attendance_marked", {
      attendanceHour: 9,
      attendanceDate: new Date("2026-06-25T00:00:00.000Z"),
    });

    expect(result.xpAwarded).toBeGreaterThan(0);
    expect(result.reason).toBeUndefined();
  });
});