import { describe, test, expect, vi, beforeEach } from "vitest";

// No Upstash env vars are set in this test file, so the real withLock()
// would bypass to a no-op (local-bypass-lock) and not serialize anything.
// We mock it to serialize calls per resource key — this is what the real
// Redis-backed distributed lock (SET NX) guarantees in production — so the
// test actually exercises the insertOne-based idempotency guarantee rather
// than relying on the lock alone.
vi.mock("@/lib/lockManager", () => {
  const queues = new Map();
  return {
    withLock: vi.fn((resource, fn) => {
      const previous = queues.get(resource) || Promise.resolve();
      const next = previous.then(() => fn(), () => fn());
      queues.set(resource, next.catch(() => {}));
      return next;
    }),
  };
});

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

/**
 * Mirrors the unique index on { userId } described in lib/mongodb.js:
 * a second insertOne() for the same userId throws a MongoServerError
 * with code 11000, matching real MongoDB duplicate-key behavior.
 */
function createFakeAbsenceNotificationsCollection() {
  const reserved = new Set();
  return {
    insertOne: vi.fn(async (doc) => {
      if (reserved.has(doc.userId)) {
        const err = new Error("E11000 duplicate key error");
        err.code = 11000;
        throw err;
      }
      reserved.add(doc.userId);
      return { insertedId: "fake-id" };
    }),
  };
}

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

describe("sendAbsenceAlert — prevents duplicate parent alerts under concurrent/retried cron runs (#4048)", () => {
  let notificationCollection;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    notificationCollection = createFakeAbsenceNotificationsCollection();

    const { connectDb } = await import("@/lib/mongodb");
    connectDb.mockResolvedValue({
      collection: vi.fn(() => notificationCollection),
    });
  });

  test("two concurrent calls for the same student within the cooldown window result in only one insert/alert", async () => {
    const { sendAbsenceAlert } = await import("../notificationService");

    const student = {
      userId: "student-1",
      studentName: "Test Student",
      email: "student1@example.com",
    };

    const [resultA, resultB] = await Promise.all([
      sendAbsenceAlert(student, 3),
      sendAbsenceAlert(student, 3),
    ]);

    const results = [resultA, resultB];
    expect(results.filter((r) => r === true)).toHaveLength(1);
    expect(results.filter((r) => r === false)).toHaveLength(1);
    expect(notificationCollection.insertOne).toHaveBeenCalledTimes(2);
  });

  test("retried invocation after a successful send is skipped, not re-sent", async () => {
    const { sendAbsenceAlert } = await import("../notificationService");

    const student = {
      userId: "student-2",
      studentName: "Another Student",
      email: "student2@example.com",
    };

    const first = await sendAbsenceAlert(student, 4);
    const retry = await sendAbsenceAlert(student, 4);

    expect(first).toBe(true);
    expect(retry).toBe(false);
    expect(notificationCollection.insertOne).toHaveBeenCalledTimes(2);
  });

  test("different students are not blocked by each other's reservations", async () => {
    const { sendAbsenceAlert } = await import("../notificationService");

    const [resultA, resultB] = await Promise.all([
      sendAbsenceAlert({ userId: "student-3", studentName: "A" }, 3),
      sendAbsenceAlert({ userId: "student-4", studentName: "B" }, 3),
    ]);

    expect(resultA).toBe(true);
    expect(resultB).toBe(true);
  });
});