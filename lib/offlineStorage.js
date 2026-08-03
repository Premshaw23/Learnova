/**
 * ============================================================================
 * 🏗️ UNIFIED OFFLINE STORAGE LAYER (Issue #4224)
 * ============================================================================
 * Single source of truth for all offline data storage in Learnova.
 * Replaces fragmented IndexedDB, localStorage, and Service Worker cache
 * with a consistent schema and vector clock-based versioning.
 */

import { openDB } from "idb";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = "learnova-offline-unified";
const DB_VERSION = 1;

/** Object store names */
export const STORES = {
  RECORDS: "offline-records",
  QUEUE: "sync-queue",
  CONFLICTS: "conflict-log",
  META: "sync-metadata",
};

/** Record types that can be stored offline */
export const RECORD_TYPES = {
  ATTENDANCE: "attendance",
  QUIZ: "quiz",
  ACTIVITY: "activity",
  COMPLAINT: "complaint",
  GENERAL: "general",
};

/** Sync status lifecycle */
export const SYNC_STATUS = {
  PENDING: "pending",
  SYNCING: "syncing",
  SYNCED: "synced",
  CONFLICT: "conflict",
  FAILED: "failed",
};

// ---------------------------------------------------------------------------
// Vector Clock Implementation
// ---------------------------------------------------------------------------

/**
 * A lightweight vector clock for tracking causality across devices.
 * Each device/node gets an entry in the clock map.
 */
export class VectorClock {
  /**
   * @param {Record<string, number>} [clock={}] - Initial clock state
   */
  constructor(clock = {}) {
    this.clock = { ...clock };
  }

  /** Increment the counter for the given node. */
  increment(nodeId) {
    this.clock[nodeId] = (this.clock[nodeId] || 0) + 1;
    return this;
  }

  /** Merge another vector clock into this one (take component-wise max). */
  merge(other) {
    const otherClock = other instanceof VectorClock ? other.clock : other;
    for (const [node, counter] of Object.entries(otherClock)) {
      this.clock[node] = Math.max(this.clock[node] || 0, counter);
    }
    return this;
  }

  /**
   * Determine the causal relationship between two vector clocks.
   * @returns {'before' | 'after' | 'concurrent' | 'equal'}
   */
  compare(other) {
    const otherClock = other instanceof VectorClock ? other.clock : other;
    const allNodes = new Set([
      ...Object.keys(this.clock),
      ...Object.keys(otherClock),
    ]);

    let hasLesser = false;
    let hasGreater = false;

    for (const node of allNodes) {
      const a = this.clock[node] || 0;
      const b = otherClock[node] || 0;
      if (a < b) hasLesser = true;
      if (a > b) hasGreater = true;
    }

    if (hasLesser && hasGreater) return "concurrent";
    if (hasLesser) return "before";
    if (hasGreater) return "after";
    return "equal";
  }

  /** Serialise to a plain object for storage. */
  toJSON() {
    return { ...this.clock };
  }

  /** Reconstruct from a plain object. */
  static fromJSON(obj) {
    return new VectorClock(obj);
  }
}

// ---------------------------------------------------------------------------
// OfflineRecord Schema
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} OfflineRecord
 * @property {string} id          - UUID primary key
 * @property {string} type        - One of RECORD_TYPES
 * @property {string} collection  - Logical collection name (e.g. "attendance")
 * @property {Object} data        - The actual record payload
 * @property {number} version     - Monotonic version counter
 * @property {Object} vectorClock - Vector clock state
 * @property {string} status      - One of SYNC_STATUS
 * @property {string} deviceId    - Local device identifier
 * @property {number} createdAt   - Epoch ms
 * @property {number} updatedAt   - Epoch ms
 * @property {number|null} syncedAt - Epoch ms when last synced
 * @property {number} retryCount  - Number of sync retries attempted
 * @property {Object|null} conflictData - Previous version when conflict detected
 * @property {number} priority    - Lower = higher priority (attendance=1 …)
 */

const PRIORITY_MAP = {
  [RECORD_TYPES.ATTENDANCE]: 1,
  [RECORD_TYPES.QUIZ]: 2,
  [RECORD_TYPES.ACTIVITY]: 3,
  [RECORD_TYPES.COMPLAINT]: 4,
  [RECORD_TYPES.GENERAL]: 5,
};

/**
 * Create a new OfflineRecord with sane defaults.
 */
export function createOfflineRecord({
  id,
  type,
  collection,
  data,
  deviceId,
  vectorClock,
}) {
  const now = Date.now();
  return {
    id: id || crypto.randomUUID(),
    type,
    collection,
    data,
    version: 1,
    vectorClock: vectorClock instanceof VectorClock
      ? vectorClock.toJSON()
      : vectorClock || {},
    status: SYNC_STATUS.PENDING,
    deviceId: deviceId || getDeviceId(),
    createdAt: now,
    updatedAt: now,
    syncedAt: null,
    retryCount: 0,
    conflictData: null,
    priority: PRIORITY_MAP[type] || 5,
  };
}

// ---------------------------------------------------------------------------
// Device ID helper (persists across sessions)
// ---------------------------------------------------------------------------

let _deviceId = null;

export function getDeviceId() {
  if (_deviceId) return _deviceId;
  if (typeof window === "undefined") return "server";
  try {
    let stored = localStorage.getItem("learnova_device_id");
    if (!stored) {
      stored = `device_${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem("learnova_device_id", stored);
    }
    _deviceId = stored;
    return stored;
  } catch {
    return "device_unknown";
  }
}

// ---------------------------------------------------------------------------
// Database Initialisation
// ---------------------------------------------------------------------------

let _dbPromise = null;

/**
 * Returns the singleton IndexedDB connection, creating stores on first run.
 */
export function getUnifiedDb() {
  if (_dbPromise) return _dbPromise;

  _dbPromise = openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // --- Records store ---
      if (!db.objectStoreNames.contains(STORES.RECORDS)) {
        const recStore = db.createObjectStore(STORES.RECORDS, { keyPath: "id" });
        recStore.createIndex("status", "status");
        recStore.createIndex("type", "type");
        recStore.createIndex("collection", "collection");
        recStore.createIndex("priority", "priority");
        recStore.createIndex("updatedAt", "updatedAt");
        recStore.createIndex("type_status", ["type", "status"]);
        recStore.createIndex("collection_status", ["collection", "status"]);
      }

      // --- Sync queue (ordered by priority) ---
      if (!db.objectStoreNames.contains(STORES.QUEUE)) {
        const qStore = db.createObjectStore(STORES.QUEUE, {
          keyPath: "id",
          autoIncrement: true,
        });
        qStore.createIndex("recordId", "recordId");
        qStore.createIndex("priority", "priority");
        qStore.createIndex("status", "status");
      }

      // --- Conflict log ---
      if (!db.objectStoreNames.contains(STORES.CONFLICTS)) {
        const cStore = db.createObjectStore(STORES.CONFLICTS, {
          keyPath: "id",
          autoIncrement: true,
        });
        cStore.createIndex("recordId", "recordId");
        cStore.createIndex("resolved", "resolved");
      }

      // --- Metadata ---
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: "key" });
      }
    },
  });

  return _dbPromise;
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Upsert a record into unified storage.
 * Increments the version and vector clock automatically.
 */
export async function upsertRecord(record) {
  const db = await getUnifiedDb();
  const now = Date.now();
  const tx = db.transaction(STORES.RECORDS, "readwrite");
  const store = tx.objectStore(STORES.RECORDS);

  const existing = await store.get(record.id);

  const merged = {
    ...record,
    version: (existing?.version || 0) + 1,
    updatedAt: now,
    status: record.status || SYNC_STATUS.PENDING,
    retryCount: record.retryCount ?? existing?.retryCount ?? 0,
    createdAt: existing?.createdAt || now,
  };

  // Merge vector clocks
  const vc = new VectorClock(existing?.vectorClock || {});
  vc.merge(record.vectorClock || {});
  vc.increment(getDeviceId());
  merged.vectorClock = vc.toJSON();

  await store.put(merged);
  await tx.done;

  logger.info(`[OfflineStorage] Upserted record ${merged.id} v${merged.version}`);
  return merged;
}

/**
 * Get a record by ID.
 */
export async function getRecord(id) {
  const db = await getUnifiedDb();
  return db.get(STORES.RECORDS, id);
}

/**
 * Get all records matching a query.
 * @param {Object} [query={}]  - Optional filter { type, collection, status }
 */
export async function queryRecords(query = {}) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.RECORDS, "readonly");
  const store = tx.objectStore(STORES.RECORDS);

  let records;

  if (query.type && query.status) {
    records = await store.index("type_status").getAll([query.type, query.status]);
  } else if (query.collection && query.status) {
    records = await store
      .index("collection_status")
      .getAll([query.collection, query.status]);
  } else if (query.status) {
    records = await store.index("status").getAll(query.status);
  } else if (query.type) {
    records = await store.index("type").getAll(query.type);
  } else {
    records = await store.getAll();
  }

  await tx.done;
  return records;
}

/**
 * Delete a record by ID.
 */
export async function deleteRecord(id) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.RECORDS, "readwrite");
  const store = tx.objectStore(STORES.RECORDS);
  await store.delete(id);
  await tx.done;
  logger.info(`[OfflineStorage] Deleted record ${id}`);
}

/**
 * Get all pending records, ordered by priority (lower = higher priority).
 */
export async function getPendingRecords() {
  const records = await queryRecords({ status: SYNC_STATUS.PENDING });
  return records.sort((a, b) => a.priority - b.priority);
}

/**
 * Count pending records.
 */
export async function getPendingCount() {
  const records = await getPendingRecords();
  return records.length;
}

/**
 * Mark a record as synced.
 */
export async function markSynced(id) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.RECORDS, "readwrite");
  const store = tx.objectStore(STORES.RECORDS);
  const record = await store.get(id);
  if (record) {
    record.status = SYNC_STATUS.SYNCED;
    record.syncedAt = Date.now();
    record.retryCount = 0;
    await store.put(record);
  }
  await tx.done;
}

/**
 * Mark a record as having a conflict.
 */
export async function markConflict(id, serverVersion) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.RECORDS, "readwrite");
  const store = tx.objectStore(STORES.RECORDS);
  const record = await store.get(id);
  if (record) {
    record.status = SYNC_STATUS.CONFLICT;
    record.conflictData = serverVersion;
    await store.put(record);
  }
  await tx.done;

  // Also log the conflict
  await logConflict(id, record, serverVersion);
}

/**
 * Increment retry count and optionally mark as failed.
 */
export async function incrementRetry(id, maxRetries = 5) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.RECORDS, "readwrite");
  const store = tx.objectStore(STORES.RECORDS);
  const record = await store.get(id);
  if (record) {
    record.retryCount += 1;
    if (record.retryCount >= maxRetries) {
      record.status = SYNC_STATUS.FAILED;
    }
    await store.put(record);
  }
  await tx.done;
}

// ---------------------------------------------------------------------------
// Conflict Logging
// ---------------------------------------------------------------------------

async function logConflict(recordId, localVersion, remoteVersion) {
  const db = await getUnifiedDb();
  await db.add(STORES.CONFLICTS, {
    recordId,
    localVersion,
    remoteVersion,
    resolved: false,
    detectedAt: Date.now(),
  });
}

/**
 * Get all unresolved conflicts.
 */
export async function getUnresolvedConflicts() {
  const db = await getUnifiedDb();
  return db.getAllFromIndex(STORES.CONFLICTS, "resolved", false);
}

/**
 * Mark a conflict as resolved.
 */
export async function resolveConflictLog(recordId) {
  const db = await getUnifiedDb();
  const tx = db.transaction(STORES.CONFLICTS, "readwrite");
  const store = tx.objectStore(STORES.CONFLICTS);
  const index = store.index("recordId");
  const conflicts = await index.getAll(recordId);
  for (const c of conflicts) {
    c.resolved = true;
    c.resolvedAt = Date.now();
    await store.put(c);
  }
  await tx.done;
}

// ---------------------------------------------------------------------------
// Metadata Helpers
// ---------------------------------------------------------------------------

export async function getMeta(key) {
  const db = await getUnifiedDb();
  const entry = await db.get(STORES.META, key);
  return entry?.value ?? null;
}

export async function setMeta(key, value) {
  const db = await getUnifiedDb();
  await db.put(STORES.META, { key, value, updatedAt: Date.now() });
}

// ---------------------------------------------------------------------------
// Bulk / Utility
// ---------------------------------------------------------------------------

/**
 * Clear all offline data (use with caution).
 */
export async function clearAll() {
  const db = await getUnifiedDb();
  const tx = db.transaction(
    [STORES.RECORDS, STORES.QUEUE, STORES.CONFLICTS, STORES.META],
    "readwrite"
  );
  await Promise.all([
    tx.objectStore(STORES.RECORDS).clear(),
    tx.objectStore(STORES.QUEUE).clear(),
    tx.objectStore(STORES.CONFLICTS).clear(),
    tx.objectStore(STORES.META).clear(),
  ]);
  await tx.done;
  logger.warn("[OfflineStorage] All offline data cleared");
}

/**
 * Get storage stats for dashboards.
 */
export async function getStorageStats() {
  const db = await getUnifiedDb();
  const all = await db.getAll(STORES.RECORDS);
  const conflicts = await db.getAll(STORES.CONFLICTS);
  const unresolved = conflicts.filter((c) => !c.resolved);

  const byStatus = {};
  const byType = {};
  for (const r of all) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    byType[r.type] = (byType[r.type] || 0) + 1;
  }

  return {
    total: all.length,
    pending: byStatus[SYNC_STATUS.PENDING] || 0,
    synced: byStatus[SYNC_STATUS.SYNCED] || 0,
    conflict: byStatus[SYNC_STATUS.CONFLICT] || 0,
    failed: byStatus[SYNC_STATUS.FAILED] || 0,
    syncing: byStatus[SYNC_STATUS.SYNCING] || 0,
    totalConflicts: conflicts.length,
    unresolvedConflicts: unresolved.length,
    byType,
  };
}
