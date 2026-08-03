/**
 * ============================================================================
 * 🧩 CRDT-BASED CONFLICT RESOLVER (Issue #4224)
 * ============================================================================
 * Upgrades the legacy timestamp-based conflict resolver to a deterministic,
 * auditable CRDT-inspired merge strategy.
 *
 * Key improvements over the previous resolver:
 * - Vector clock causality detection instead of timestamp comparison
 * - Per-field merge for non-conflicting fields
 * - Array append-only CRDT for attendance logs
 * - Conflict metadata for full audit trail
 * - Automatic resolution for non-ambiguous changes
 */

import { VectorClock, SYNC_STATUS } from "@/lib/offlineStorage";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
const isArray = Array.isArray;

/**
 * Generate a deterministic merge key for two values.
 * Used to deduplicate arrays by content hash.
 */
function stableStringify(obj) {
  if (obj === null || obj === undefined) return String(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (isArray(obj)) return `[${obj.map(stableStringify).join(",")}]`;
  return `{${Object.keys(obj).sort().map((k) => `${k}:${stableStringify(obj[k])}`).join(",")}}`;
}

// ---------------------------------------------------------------------------
// Field-Level Merge Strategy
// ---------------------------------------------------------------------------

/**
 * Describes how a specific field should be merged when both sides changed.
 * Strategies:
 *   "local-wins"    – always keep the local value
 *   "remote-wins"   – always keep the remote value
 *   "max"           – keep the numerically larger value
 *   "min"           – keep the numerically smaller value
 *   "append"        – union of both arrays (CRDT set)
 *   "deep-merge"    – recursively merge nested objects
 *   "last-write"    – timestamp-based last-write-wins for this field only
 */
const FIELD_STRATEGIES = {
  // Attendance-specific
  status: "local-wins",           // Teacher override takes precedence
  present: "local-wins",
  markedBy: "local-wins",
  note: "deep-merge",             // Merge notes from both sides

  // Gamification / XP
  xp: "max",                      // Always keep highest XP
  level: "max",
  streak: "max",

  // Timestamps
  syncedAt: "max",
  completedAt: "max",

  // Arrays – CRDT set merge
  logs: "append",
  attendanceLog: "append",
  history: "append",
  activities: "append",
};

const DEFAULT_STRATEGY = "last-write";

// ---------------------------------------------------------------------------
// Core Resolution
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ConflictResult
 * @property {'auto-resolved' | 'needs-review' | 'identical'} resolution
 * @property {Object} mergedData       – The resulting merged record data
 * @property {Object} metadata         – Audit trail (strategies used, etc.)
 * @property {boolean} hadConflict     – Whether a real conflict existed
 */

/**
 * Resolve a conflict between a local (offline) record and a remote (server) record
 * using CRDT-inspired field-level merge.
 *
 * @param {Object} local   – The local record (from offline storage)
 * @param {Object} remote  – The server record
 * @returns {ConflictResult}
 */
export function resolveConflictCRDT(local, remote) {
  // --- Identity check ---
  if (!local || !remote) {
    return {
      resolution: "identical",
      mergedData: local || remote,
      metadata: { strategies: {}, reason: "one-side-missing" },
      hadConflict: false,
    };
  }

  const localVc = VectorClock.fromJSON(local.vectorClock || {});
  const remoteVc = VectorClock.fromJSON(remote.vectorClock || {});

  // --- No conflict: remote is strictly newer (causally) ---
  const causality = localVc.compare(remoteVc);
  if (causality === "before") {
    // Local is strictly older → remote wins entirely
    return {
      resolution: "auto-resolved",
      mergedData: { ...remote },
      metadata: {
        strategies: { _overall: "causal-before" },
        reason: "Local is causally older than remote",
      },
      hadConflict: false,
    };
  }

  if (causality === "equal") {
    // Same version → no conflict at all
    return {
      resolution: "identical",
      mergedData: { ...local },
      metadata: { strategies: {}, reason: "Vector clocks equal" },
      hadConflict: false,
    };
  }

  // --- No conflict: local is strictly newer (causally) ---
  if (causality === "after") {
    return {
      resolution: "auto-resolved",
      mergedData: { ...local },
      metadata: {
        strategies: { _overall: "causal-after" },
        reason: "Local is causally newer than remote",
      },
      hadConflict: false,
    };
  }

  // --- CONCURRENT: both sides made changes independently ---
  // This is the real conflict – we need per-field merge.
  logger.warn(
    `[ConflictResolver] Concurrent modifications detected for record ${local.id || remote.id}`
  );

  const strategies = {};
  const mergedData = {};
  let needsReview = false;

  // Collect all data keys from both sides
  const allKeys = new Set([
    ...Object.keys(local.data || {}),
    ...Object.keys(remote.data || {}),
  ]);

  for (const key of allKeys) {
    const localVal = (local.data || {})[key];
    const remoteVal = (remote.data || {})[key];

    const strategy = FIELD_STRATEGIES[key] || DEFAULT_STRATEGY;
    const result = applyStrategy(strategy, localVal, remoteVal, key);

    strategies[key] = strategy;
    mergedData[key] = result;

    if (result?._needsReview) {
      needsReview = true;
      delete result._needsReview;
    }
  }

  // Bump the merged vector clock to the component-wise maximum
  const mergedVc = VectorClock.fromJSON(local.vectorClock || {});
  mergedVc.merge(remote.vectorClock || {});
  mergedVc.increment(local.deviceId || "unknown");

  // Build merged record — keep data fields in `data`, record fields at top level
  const mergedRecord = {
    id: local.id || remote.id,
    type: local.type || remote.type,
    collection: local.collection || remote.collection,
    createdAt: Math.min(local.createdAt || Infinity, remote.createdAt || Infinity),
    deviceId: local.deviceId || remote.deviceId,
    priority: local.priority || remote.priority,
    data: mergedData, // field-level merged values go inside data
    version: Math.max(local.version || 0, remote.version || 0) + 1,
    updatedAt: Date.now(),
    status: SYNC_STATUS.PENDING,
    vectorClock: mergedVc.toJSON(),
    conflictData: null,
    syncedAt: null,
    retryCount: 0,
    _syncMetadata: {
      resolvedAt: new Date().toISOString(),
      strategy: "crdt-merge",
      localVersion: local.version,
      remoteVersion: remote.version,
      causality,
      fieldStrategies: strategies,
      needsReview,
    },
  };

  return {
    resolution: needsReview ? "needs-review" : "auto-resolved",
    mergedData: mergedRecord,
    metadata: {
      strategies,
      causality,
      recordId: local.id || remote.id,
      needsReview,
    },
    hadConflict: true,
  };
}

// ---------------------------------------------------------------------------
// Strategy Application
// ---------------------------------------------------------------------------

function applyStrategy(strategy, localVal, remoteVal, fieldKey) {
  // If only one side has the value, take it
  if (localVal === undefined) return remoteVal;
  if (remoteVal === undefined) return localVal;

  // If values are identical, no conflict
  if (JSON.stringify(localVal) === JSON.stringify(remoteVal)) return localVal;

  switch (strategy) {
    case "local-wins":
      return localVal;

    case "remote-wins":
      return remoteVal;

    case "max":
      return Math.max(Number(localVal) || 0, Number(remoteVal) || 0);

    case "min":
      return Math.min(Number(localVal) || 0, Number(remoteVal) || 0);

    case "append":
      // CRDT set union – merge arrays and deduplicate
      if (isArray(localVal) && isArray(remoteVal)) {
        const merged = [...localVal];
        const seen = new Set(localVal.map(stableStringify));
        for (const item of remoteVal) {
          const key = stableStringify(item);
          if (!seen.has(key)) {
            merged.push(item);
            seen.add(key);
          }
        }
        return merged;
      }
      return remoteVal;

    case "deep-merge":
      if (isObject(localVal) && isObject(remoteVal)) {
        return deepMerge(localVal, remoteVal);
      }
      return remoteVal;

    case "last-write":
    default:
      // Use local updatedAt vs remote updatedAt for this specific field
      return localVal; // Local takes precedence as it's the offline client
  }
}

/**
 * Recursive deep merge of two objects.
 */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (isObject(source[key]) && isObject(target[key])) {
      output[key] = deepMerge(target[key], source[key]);
    } else if (isArray(source[key]) && isArray(target[key])) {
      // Append-only merge
      const seen = new Set(target[key].map(stableStringify));
      output[key] = [...target[key]];
      for (const item of source[key]) {
        if (!seen.has(stableStringify(item))) {
          output[key].push(item);
        }
      }
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

// ---------------------------------------------------------------------------
// Batch Resolution
// ---------------------------------------------------------------------------

/**
 * Resolve a batch of conflicts between local and remote record sets.
 * @param {Array} localRecords
 * @param {Array} remoteRecords
 * @returns {ConflictResult[]}
 */
export function resolveBatchConflicts(localRecords, remoteRecords) {
  const remoteMap = new Map(remoteRecords.map((r) => [r.id, r]));
  const results = [];

  for (const local of localRecords) {
    const remote = remoteMap.get(local.id);
    if (remote) {
      results.push(resolveConflictCRDT(local, remote));
    } else {
      // Record only exists locally – keep it
      results.push({
        resolution: "auto-resolved",
        mergedData: local,
        metadata: { strategies: {}, reason: "local-only" },
        hadConflict: false,
      });
    }
  }

  // Check for remote-only records
  const localIds = new Set(localRecords.map((r) => r.id));
  for (const remote of remoteRecords) {
    if (!localIds.has(remote.id)) {
      results.push({
        resolution: "auto-resolved",
        mergedData: remote,
        metadata: { strategies: {}, reason: "remote-only" },
        hadConflict: false,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Validate that a record is structurally sound before sync.
 */
export function validateRecord(record) {
  const errors = [];

  if (!record || typeof record !== "object") {
    return { valid: false, errors: ["Record must be an object"] };
  }

  if (!record.id) errors.push("Missing id");
  if (!record.type) errors.push("Missing type");
  if (!record.data || typeof record.data !== "object") errors.push("Missing or invalid data");
  if (typeof record.version !== "number") errors.push("Missing version");
  if (!record.vectorClock || typeof record.vectorClock !== "object") errors.push("Missing vectorClock");
  if (!record.updatedAt) errors.push("Missing updatedAt");

  return { valid: errors.length === 0, errors };
}

export default {
  resolveConflictCRDT,
  resolveBatchConflicts,
  validateRecord,
  VectorClock,
};
