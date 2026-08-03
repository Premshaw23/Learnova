/**
 * ============================================================================
 * 🧪 OFFLINE SIMULATION TEST SUITE (Issue #4224)
 * ============================================================================
 * Comprehensive tests for the unified offline-first architecture:
 *   - Vector clock causality detection
 *   - CRDT conflict resolution
 *   - Sync protocol two-phase operations
 *   - Concurrent modification handling
 *   - Storage stats and queue management
 *   - Backward compatibility with legacy APIs
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// In-memory store for mocking
// ---------------------------------------------------------------------------

const recordStore = new Map();
const metaStore = new Map();
const conflictStore = new Map();

function resetStores() {
  recordStore.clear();
  metaStore.clear();
  conflictStore.clear();
}

// Mock idb - minimal mock that works with the unified storage layer
vi.mock("idb", () => {
  const sharedRecordStore = recordStore;
  const sharedMetaStore = metaStore;
  const sharedConflictStore = conflictStore;

  const STORES_MAP = {
    "offline-records": sharedRecordStore,
    "sync-queue": new Map(),
    "conflict-log": sharedConflictStore,
    "sync-metadata": sharedMetaStore,
  };

  function makeObjectStore(storeName) {
    const store = STORES_MAP[storeName] || new Map();
    return {
      get: vi.fn(async (id) => store.get(id) || undefined),
      getAll: vi.fn(async () => Array.from(store.values())),
      put: vi.fn(async (record) => {
        store.set(record.id, record);
      }),
      add: vi.fn(async (record) => {
        store.set(record.id, record);
      }),
      delete: vi.fn(async (id) => {
        store.delete(id);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
      index: (idxName) => ({
        getAll: vi.fn(async (query) => {
          if (query !== undefined) {
            return Array.from(store.values()).filter((r) => {
              if (Array.isArray(query)) {
                // Compound index match
                return (
                  r[idxName.split("_")[0]] === query[0] &&
                  r[idxName.split("_")[1]] === query[1]
                );
              }
              return r[idxName] === query;
            });
          }
          return Array.from(store.values());
        }),
      }),
    };
  }

  return {
    openDB: vi.fn(async () => ({
      objectStoreNames: {
        contains: (n) => n in STORES_MAP,
      },
      createObjectStore: vi.fn(() => ({ createIndex: vi.fn() })),
      transaction: vi.fn((names, mode) => {
        const storeNames = Array.isArray(names) ? names : [names];
        const firstStore = storeNames[0];
        return {
          objectStore: vi.fn((name) => makeObjectStore(name || firstStore)),
          done: Promise.resolve(),
        };
      }),
      get: vi.fn(async (name, id) => {
        const store = STORES_MAP[name] || new Map();
        return store.get(id) || undefined;
      }),
      put: vi.fn(async (name, record) => {
        const store = STORES_MAP[name] || new Map();
        store.set(record.id, record);
      }),
      add: vi.fn(async (name, record) => {
        const store = STORES_MAP[name] || new Map();
        store.set(record.id, record);
      }),
      objectStore: vi.fn((name) => makeObjectStore(name)),
      getAll: vi.fn(async (name) => {
        const store = STORES_MAP[name] || new Map();
        return Array.from(store.values());
      }),
      getAllFromIndex: vi.fn(async (name) => {
        const store = STORES_MAP[name] || new Map();
        return Array.from(store.values());
      }),
      clear: vi.fn(async (name) => {
        const store = STORES_MAP[name];
        if (store) store.clear();
      }),
    })),
  };
});

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock activityService and statsService (for offlineSyncService)
vi.mock("@/services/activityService", () => ({
  updateActivityProgress: vi.fn(async () => ({})),
}));

vi.mock("@/services/statsService", () => ({
  updateUserStat: vi.fn(async () => ({})),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("VectorClock", () => {
  let VectorClock;

  beforeEach(async () => {
    const mod = await import("@/lib/offlineStorage");
    VectorClock = mod.VectorClock;
  });

  it("should increment node counters independently", () => {
    const vc = new VectorClock();
    vc.increment("device_a");
    vc.increment("device_a");
    vc.increment("device_b");

    expect(vc.clock).toEqual({ device_a: 2, device_b: 1 });
  });

  it("should merge two clocks taking component-wise max", () => {
    const vc1 = new VectorClock({ a: 3, b: 1 });
    const vc2 = new VectorClock({ b: 5, c: 2 });

    vc1.merge(vc2);

    expect(vc1.clock).toEqual({ a: 3, b: 5, c: 2 });
  });

  it("should detect 'before' causality", () => {
    const vc1 = new VectorClock({ a: 1, b: 2 });
    const vc2 = new VectorClock({ a: 2, b: 3 });

    expect(vc1.compare(vc2)).toBe("before");
  });

  it("should detect 'after' causality", () => {
    const vc1 = new VectorClock({ a: 3, b: 3 });
    const vc2 = new VectorClock({ a: 2, b: 3 });

    expect(vc1.compare(vc2)).toBe("after");
  });

  it("should detect 'concurrent' modifications", () => {
    const vc1 = new VectorClock({ a: 3, b: 1 });
    const vc2 = new VectorClock({ a: 2, b: 3 });

    expect(vc1.compare(vc2)).toBe("concurrent");
  });

  it("should detect 'equal' clocks", () => {
    const vc1 = new VectorClock({ a: 2, b: 3 });
    const vc2 = new VectorClock({ a: 2, b: 3 });

    expect(vc1.compare(vc2)).toBe("equal");
  });

  it("should serialise and deserialise", () => {
    const vc = new VectorClock({ x: 10, y: 20 });
    const json = vc.toJSON();
    const restored = VectorClock.fromJSON(json);

    expect(restored.clock).toEqual({ x: 10, y: 20 });
  });
});

describe("CRDT Conflict Resolution", () => {
  let resolveConflictCRDT;

  beforeEach(async () => {
    const mod = await import("@/lib/conflictResolver");
    resolveConflictCRDT = mod.resolveConflictCRDT;
  });

  it("should return local when local is causally newer", () => {
    const local = {
      id: "r1",
      data: { status: "present" },
      vectorClock: { device_a: 5 },
      version: 5,
      createdAt: 1000,
      updatedAt: 2000,
      deviceId: "device_a",
    };
    const remote = {
      id: "r1",
      data: { status: "absent" },
      vectorClock: { device_a: 3 },
      version: 3,
      createdAt: 1000,
      updatedAt: 1500,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(local, remote);

    expect(result.resolution).toBe("auto-resolved");
    expect(result.hadConflict).toBe(false);
    expect(result.mergedData.data.status).toBe("present");
  });

  it("should return remote when remote is causally newer", () => {
    const local = {
      id: "r1",
      data: { status: "absent" },
      vectorClock: { device_a: 2 },
      version: 2,
      createdAt: 1000,
      updatedAt: 1000,
      deviceId: "device_a",
    };
    const remote = {
      id: "r1",
      data: { status: "present" },
      vectorClock: { device_a: 5 },
      version: 5,
      createdAt: 1000,
      updatedAt: 3000,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(local, remote);

    expect(result.resolution).toBe("auto-resolved");
    expect(result.hadConflict).toBe(false);
  });

  it("should auto-resolve concurrent changes with local-wins strategy for status field", () => {
    const local = {
      id: "r1",
      data: { status: "present", note: "checked" },
      vectorClock: { device_a: 3 },
      version: 3,
      createdAt: 1000,
      updatedAt: 2000,
      deviceId: "device_a",
    };
    const remote = {
      id: "r1",
      data: { status: "absent", note: "marked by teacher" },
      vectorClock: { device_b: 3 },
      version: 3,
      createdAt: 1000,
      updatedAt: 2500,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(local, remote);

    // Concurrent but auto-resolved via field strategies
    expect(result.hadConflict).toBe(true);
    expect(result.metadata.strategies.status).toBe("local-wins");
  });

  it("should merge arrays using CRDT set union (append strategy)", () => {
    const local = {
      id: "r1",
      data: { logs: ["a", "b"] },
      vectorClock: { device_a: 2 },
      version: 2,
      createdAt: 1000,
      updatedAt: 1500,
      deviceId: "device_a",
    };
    const remote = {
      id: "r1",
      data: { logs: ["b", "c"] },
      vectorClock: { device_b: 2 },
      version: 2,
      createdAt: 1000,
      updatedAt: 1800,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(local, remote);

    expect(result.hadConflict).toBe(true);
    expect(result.mergedData.data.logs).toEqual(
      expect.arrayContaining(["a", "b", "c"])
    );
  });

  it("should use max strategy for XP field", () => {
    const local = {
      id: "r1",
      data: { xp: 50 },
      vectorClock: { device_a: 2 },
      version: 2,
      createdAt: 1000,
      updatedAt: 1500,
      deviceId: "device_a",
    };
    const remote = {
      id: "r1",
      data: { xp: 100 },
      vectorClock: { device_b: 2 },
      version: 2,
      createdAt: 1000,
      updatedAt: 1800,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(local, remote);

    expect(result.hadConflict).toBe(true);
    expect(result.mergedData.data.xp).toBe(100);
  });

  it("should return identical when both sides are equal", () => {
    const record = {
      id: "r1",
      data: { status: "present" },
      vectorClock: { device_a: 3 },
      version: 3,
      createdAt: 1000,
      updatedAt: 2000,
      deviceId: "device_a",
    };

    const result = resolveConflictCRDT({ ...record }, { ...record });

    expect(result.resolution).toBe("identical");
    expect(result.hadConflict).toBe(false);
  });

  it("should handle missing local record", () => {
    const remote = {
      id: "r1",
      data: { status: "present" },
      vectorClock: {},
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
      deviceId: "device_b",
    };

    const result = resolveConflictCRDT(null, remote);

    expect(result.resolution).toBe("identical");
    expect(result.mergedData).toEqual(remote);
  });

  it("should handle missing remote record", () => {
    const local = {
      id: "r1",
      data: { status: "present" },
      vectorClock: {},
      version: 1,
      createdAt: 1000,
      updatedAt: 1000,
      deviceId: "device_a",
    };

    const result = resolveConflictCRDT(local, null);

    expect(result.resolution).toBe("identical");
    expect(result.mergedData).toEqual(local);
  });
});

describe("Record Validation", () => {
  let validateRecord;

  beforeEach(async () => {
    const mod = await import("@/lib/conflictResolver");
    validateRecord = mod.validateRecord;
  });

  it("should pass validation for a valid record", () => {
    const record = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      type: "attendance",
      collection: "attendance",
      data: { userId: "u1", date: "2026-07-30", status: "present" },
      version: 1,
      vectorClock: { device_a: 1 },
      updatedAt: Date.now(),
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation for missing id", () => {
    const record = {
      type: "attendance",
      collection: "attendance",
      data: {},
      version: 1,
      vectorClock: {},
      updatedAt: Date.now(),
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing id");
  });

  it("should fail validation for missing type", () => {
    const record = {
      id: "abc",
      collection: "attendance",
      data: {},
      version: 1,
      vectorClock: {},
      updatedAt: Date.now(),
    };

    const result = validateRecord(record);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Missing type");
  });

  it("should fail validation for null record", () => {
    const result = validateRecord(null);
    expect(result.valid).toBe(false);
  });
});

describe("Unified Storage CRUD", () => {
  let upsertRecord, getRecord, queryRecords, deleteRecord, getPendingCount;

  beforeEach(async () => {
    resetStores();
    const mod = await import("@/lib/offlineStorage");
    upsertRecord = mod.upsertRecord;
    getRecord = mod.getRecord;
    queryRecords = mod.queryRecords;
    deleteRecord = mod.deleteRecord;
    getPendingCount = mod.getPendingCount;
  });

  it("should create and retrieve a record", async () => {
    const record = await upsertRecord({
      id: "test-create-1",
      type: "attendance",
      collection: "attendance",
      data: { userId: "u1", status: "present" },
      vectorClock: { device_a: 1 },
    });

    const retrieved = await getRecord(record.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.type).toBe("attendance");
    expect(retrieved.data.userId).toBe("u1");
  });

  it("should increment version on upsert", async () => {
    const first = await upsertRecord({
      id: "test-version",
      type: "quiz",
      collection: "quiz",
      data: { score: 80 },
    });

    expect(first.version).toBe(1);

    const second = await upsertRecord({
      id: "test-version",
      type: "quiz",
      collection: "quiz",
      data: { score: 90 },
    });

    expect(second.version).toBe(2);
    expect(second.data.score).toBe(90);
  });

  it("should query records by type", async () => {
    await upsertRecord({
      id: "test-q1",
      type: "attendance",
      collection: "attendance",
      data: { userId: "u1" },
    });
    await upsertRecord({
      id: "test-q2",
      type: "quiz",
      collection: "quiz",
      data: { score: 100 },
    });

    const attendanceRecords = await queryRecords({ type: "attendance" });
    expect(attendanceRecords.length).toBeGreaterThanOrEqual(1);
    expect(
      attendanceRecords.every((r) => r.type === "attendance")
    ).toBe(true);
  });

  it("should query records by status", async () => {
    await upsertRecord({
      id: "test-s1",
      type: "attendance",
      collection: "attendance",
      data: { userId: "u_s1" },
    });

    const pending = await queryRecords({ status: "pending" });
    expect(pending.length).toBeGreaterThanOrEqual(1);
  });

  it("should delete a record", async () => {
    const record = await upsertRecord({
      id: "test-del-1",
      type: "general",
      collection: "test",
      data: { foo: "bar" },
    });

    const before = await getRecord(record.id);
    expect(before).toBeDefined();

    await deleteRecord(record.id);

    // After delete, the record should be gone
    const store = recordStore;
    expect(store.has(record.id)).toBe(false);
  });

  it("should count pending records", async () => {
    const countBefore = await getPendingCount();
    await upsertRecord({
      id: `test-count-${Date.now()}`,
      type: "attendance",
      collection: "attendance",
      data: { userId: "u_count" },
    });
    const countAfter = await getPendingCount();

    expect(countAfter).toBe(countBefore + 1);
  });
});

describe("Sync Protocol", () => {
  it("should export performSync function", async () => {
    const mod = await import("@/lib/offlineSync");
    expect(typeof mod.performSync).toBe("function");
  });

  it("should export getSyncStatus function", async () => {
    const mod = await import("@/lib/offlineSync");
    expect(typeof mod.getSyncStatus).toBe("function");
  });

  it("should export onSyncEvent function", async () => {
    const mod = await import("@/lib/offlineSync");
    expect(typeof mod.onSyncEvent).toBe("function");
    expect(typeof mod.onSyncEvent("test", () => {})).toBe("function"); // returns unsubscribe
  });

  it("should export retryFailedRecords function", async () => {
    const mod = await import("@/lib/offlineSync");
    expect(typeof mod.retryFailedRecords).toBe("function");
  });
});

describe("Backward Compatibility", () => {
  it("should export legacy functions from offlineSyncQueue", async () => {
    const mod = await import("@/services/offlineSyncQueue");
    expect(typeof mod.queueOfflineAttendance).toBe("function");
    expect(typeof mod.getPendingOfflineRecords).toBe("function");
    expect(typeof mod.markRecordAsSynced).toBe("function");
    expect(typeof mod.removeRecordFromQueue).toBe("function");
    expect(typeof mod.syncOfflineQueue).toBe("function");
    expect(typeof mod.getPendingRecordsCount).toBe("function");
  });

  it("should export legacy functions from offlineSyncService", async () => {
    const mod = await import("@/services/offlineSyncService");
    expect(typeof mod.syncPendingQuizzes).toBe("function");
    expect(typeof mod.saveOfflineQuizSubmission).toBe("function");
  });

  it("should export legacy functions from offlineRequestHandler", async () => {
    const mod = await import("@/utils/offlineRequestHandler");
    expect(typeof mod.handleOfflineRequest).toBe("function");
    expect(typeof mod.triggerOfflineSync).toBe("function");
  });

  it("should export legacy functions from offlineStore", async () => {
    const mod = await import("@/db/offlineStore");
    expect(typeof mod.addPendingAction).toBe("function");
    expect(typeof mod.getPendingActions).toBe("function");
    expect(typeof mod.updateActionStatus).toBe("function");
    expect(typeof mod.removePendingAction).toBe("function");
    expect(typeof mod.clearPendingActions).toBe("function");
  });

  it("should export validation from offlineSyncValidator", async () => {
    const mod = await import("@/utils/offlineSyncValidator");
    expect(typeof mod.validateUnifiedRecord).toBe("function");
    expect(
      typeof mod.OfflineSyncValidator.validateAttendanceRecord
    ).toBe("function");
  });
});
