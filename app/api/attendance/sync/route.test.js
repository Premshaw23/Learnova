import { POST } from "./route";
import { parseJSON } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { checkRateLimit } from "@/lib/rateLimit";
import { getUserProfile } from "@/lib/firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { connectDb } from "@/lib/mongodb";
import { getLocalDateKey } from "@/lib/dateUtils";
import { recalculateStats } from "@/lib/services/attendanceService";
import { assertApiSuccess } from "@/testUtils/assertApiSuccess";

vi.mock("@/lib/error-handler", () => {
  return {
    withErrorHandler: (handler) => {
      return async (request, ...args) => {
        try {
          return await handler(request, ...args);
        } catch (error) {
          const payload =
            error.originalMessage !== undefined
              ? error.originalMessage
              : error.message;
          return {
            status: error.statusCode ?? 500,
            json: async () => ({
              error: payload || error.message || "Internal server error",
            }),
          };
        }
      };
    },
    parseJSON: vi.fn(),
  };
});

vi.mock("@/lib/rbac", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 9 }),
}));

vi.mock("@/lib/firebase-admin", () => ({
  initFirebaseAdmin: vi.fn(),
  getUserProfile: vi.fn(),
}));

vi.mock("@/lib/dateUtils", () => ({
  getLocalDateKey: vi.fn((ts) => new Date(ts).toISOString().slice(0, 10)),
  getWeekdaysSince: vi.fn(() => 100),
}));

vi.mock("@/lib/mongodb", () => ({
  connectDb: vi.fn(),
}));

vi.mock("@/lib/services/attendanceService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, recalculateStats: vi.fn(actual.recalculateStats) };
});

vi.mock("@/lib/queue", () => ({
  enqueue: vi.fn().mockResolvedValue("job-id"),
  JOB_TYPES: { AWARD_GAMIFICATION_XP: "award_gamification_xp" },
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: vi.fn(),
  FieldValue: {
    serverTimestamp: vi.fn(() => "server-timestamp"),
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body, init = {}) => ({
      status: init.status ?? 200,
      json: async () => body,
    }),
  },
}));

const dateOf = (ts) => new Date(ts).toISOString().slice(0, 10);

function createFirestoreMock({ delayMs = 0, existingAttendance = {} } = {}) {
  const store = new Map(Object.entries(existingAttendance));
  const reads = { attendanceRecords: 0 };
  const calls = {
    attendanceSets: [],
    activitiesAdded: [],
    statsSet: 0,
    statsUpdate: 0,
    transactions: 0,
  };
  const concurrency = { active: 0, max: 0 };

  const transactionGet = vi.fn(async (ref) => ({ exists: store.has(ref) }));
  const transactionSet = vi.fn((ref, data) => {
    store.set(ref, data);
    calls.attendanceSets.push({ ref, data });
  });

  const runTransaction = vi.fn(async (callback) => {
    calls.transactions++;
    concurrency.active++;
    concurrency.max = Math.max(concurrency.max, concurrency.active);
    if (delayMs > 0)
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    try {
      await callback({ get: transactionGet, set: transactionSet });
    } finally {
      concurrency.active--;
    }
  });

  const db = {
    runTransaction,
    collection: vi.fn((name) => {
      if (name === "attendance_records") {
        return {
          doc: vi.fn((key) => key),
          where: vi.fn(() => ({
            get: vi.fn(async () => {
              reads.attendanceRecords++;
              return {
                docs: Array.from(store.entries()).map(([, data]) => ({
                  data: () => data,
                })),
              };
            }),
          })),
        };
      }
      if (name === "users") {
        return {
          doc: vi.fn(() => ({
            get: vi.fn(async () => ({ exists: false, data: () => ({}) })),
          })),
        };
      }
      if (name === "userStats") {
        return {
          doc: vi.fn(() => ({
            set: vi.fn(async () => {
              calls.statsSet++;
            }),
            update: vi.fn(async () => {
              calls.statsUpdate++;
            }),
          })),
        };
      }
      if (name === "activities") {
        return {
          add: vi.fn(async (data) => {
            calls.activitiesAdded.push(data);
          }),
        };
      }
      return {
        doc: vi.fn(() => ({ get: vi.fn(async () => ({ exists: false })) })),
      };
    }),
  };

  return { db, store, reads, calls, concurrency };
}

function createMongoMock() {
  const collections = {};
  const mongoDb = {
    collection: vi.fn((name) => {
      if (!collections[name]) {
        collections[name] = {
          updateOne: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
          deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
          findOne: vi.fn().mockResolvedValue(null),
        };
      }
      return collections[name];
    }),
  };
  connectDb.mockResolvedValue(mongoDb);
  return mongoDb;
}

describe("attendance sync route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 9 });
    requireAuth.mockResolvedValue({ uid: "user-123" });
    getUserProfile.mockResolvedValue({
      fullName: "Test User",
      email: "test@example.com",
      instituteId: "inst-1",
    });
    getLocalDateKey.mockImplementation((ts) =>
      new Date(ts).toISOString().slice(0, 10)
    );
  });

  const createRequest = (headers = {}) => {
    const headersMap = new Map(
      Object.entries({
        "x-forwarded-for": "127.0.0.1",
        ...headers,
      })
    );
    return {
      headers: {
        get: (key) => headersMap.get(key.toLowerCase()) || null,
      },
      cookies: { get: () => null },
    };
  };

  test("runs a single stats recalculation for the whole batch (O(N) not O(N²))", async () => {
    const now = Date.now();
    const records = [0, 1, 2].map((i) => ({
      id: i,
      userId: "user-123",
      confidenceScore: 85,
      queuedAt: now - i * 20 * 60 * 60 * 1000,
    }));
    parseJSON.mockResolvedValue({ records });

    const { db, reads, calls } = createFirestoreMock();
    getFirestore.mockReturnValue(db);
    createMongoMock();

    const response = await POST(createRequest());
    const body = await assertApiSuccess(response, 200);

    expect(body.syncedIds).toEqual([0, 1, 2]);
    expect(calls.attendanceSets).toHaveLength(3);
    // The full attendance_records scan runs exactly once, after the batch,
    // instead of once per record.
    expect(reads.attendanceRecords).toBe(1);
    expect(recalculateStats).toHaveBeenCalledTimes(1);
    expect(calls.statsUpdate).toBe(1);
  });

  test("deduplicates identical (uid, date) records within the batch", async () => {
    const now = Date.now();
    const queuedAt = now - 60 * 60 * 1000;
    parseJSON.mockResolvedValue({
      records: [
        { id: 1, userId: "user-123", confidenceScore: 85, queuedAt },
        { id: 2, userId: "user-123", confidenceScore: 90, queuedAt },
      ],
    });

    const { db, reads, calls } = createFirestoreMock();
    getFirestore.mockReturnValue(db);
    const mongoDb = createMongoMock();

    const response = await POST(createRequest());
    const body = await assertApiSuccess(response, 200);

    // The duplicate is acknowledged as synced so the client clears its local
    // queue, but only one write + one XP award happen for the shared date.
    expect(body.syncedIds).toEqual([1, 2]);
    expect(calls.attendanceSets).toHaveLength(1);
    expect(calls.attendanceSets[0].ref).toBe(`user-123_${dateOf(queuedAt)}`);
    expect(
      mongoDb.collection.mock.calls.filter(([name]) => name === "attendance")
    ).toHaveLength(1);
    expect(mongoDb.collection("attendance").updateOne).toHaveBeenCalledTimes(1);
    expect(reads.attendanceRecords).toBe(1);
  });

  test("processes the batch with bounded concurrency", async () => {
    const now = Date.now();
    const records = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      userId: "user-123",
      confidenceScore: 85,
      queuedAt: now - i * 60 * 60 * 1000,
    }));
    // Give every record its own calendar date (a 48h window can only fit ~3
    // real calendar days, so the date derivation is overridden per record).
    getLocalDateKey.mockImplementation((ts) => {
      const hourOffset = Math.round((now - ts) / 3600000);
      return `2026-06-${String(hourOffset + 1).padStart(2, "0")}`;
    });
    parseJSON.mockResolvedValue({ records });

    const { db, calls, concurrency } = createFirestoreMock({ delayMs: 20 });
    getFirestore.mockReturnValue(db);
    createMongoMock();

    const response = await POST(createRequest());
    const body = await assertApiSuccess(response, 200);

    expect(body.syncedIds).toHaveLength(10);
    expect(calls.attendanceSets).toHaveLength(10);
    // Records ran in parallel (more than one transaction in flight at a time)
    // but never exceeded the bounded concurrency limit of 5.
    expect(concurrency.max).toBeGreaterThanOrEqual(2);
    expect(concurrency.max).toBeLessThanOrEqual(5);
  });

  test("skips recalculation when the batch only contains already-processed records", async () => {
    const now = Date.now();
    const queuedAt = now - 60 * 60 * 1000;
    const dateKey = dateOf(queuedAt);
    const docKey = `user-123_${dateKey}`;
    parseJSON.mockResolvedValue({
      records: [{ id: 1, userId: "user-123", confidenceScore: 85, queuedAt }],
    });

    const { db, reads, calls } = createFirestoreMock({
      existingAttendance: {
        [docKey]: { userId: "user-123", date: dateKey, status: "present" },
      },
    });
    getFirestore.mockReturnValue(db);
    const mongoDb = createMongoMock();

    const response = await POST(createRequest());
    const body = await assertApiSuccess(response, 200);

    expect(body.syncedIds).toEqual([1]);
    expect(calls.attendanceSets).toHaveLength(0);
    // Nothing new was written, so the (expensive) stats scan is not re-run.
    expect(reads.attendanceRecords).toBe(0);
    expect(recalculateStats).not.toHaveBeenCalled();
    expect(mongoDb.collection).not.toHaveBeenCalledWith("attendance");
  });

  test("acknowledges deduplicated copies only when the primary record succeeds", async () => {
    const now = Date.now();
    const queuedAt = now - 60 * 60 * 1000;
    parseJSON.mockResolvedValue({
      records: [
        { id: 1, userId: "user-123", confidenceScore: 85, queuedAt },
        { id: 2, userId: "user-123", confidenceScore: 85, queuedAt },
      ],
    });

    const { db, calls, reads } = createFirestoreMock();
    db.runTransaction.mockImplementationOnce(() =>
      Promise.reject(new Error("transaction aborted"))
    );
    getFirestore.mockReturnValue(db);
    createMongoMock();

    const response = await POST(createRequest());
    const body = await assertApiSuccess(response, 200);

    // Primary write failed → the duplicate for the same date must NOT be
    // acknowledged as synced (it never was written).
    expect(body.syncedIds).toEqual([]);
    expect(body.rejectedIds).toEqual([1]);
    expect(calls.attendanceSets).toHaveLength(0);
    expect(reads.attendanceRecords).toBe(0);
  });
});
