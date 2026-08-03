/**
 * ============================================================================
 * 🗄️ OFFLINE STORE (Migrated for Issue #4224)
 * ============================================================================
 * This file now serves as a thin backward-compatible wrapper around the
 * unified offline storage layer (lib/offlineStorage.js).
 *
 * All new code should import directly from lib/offlineStorage.js.
 * This wrapper exists solely to avoid breaking existing imports.
 *
 * @deprecated Import from lib/offlineStorage.js for new features.
 */

import { openDB } from "idb";
import {
  getUnifiedDb,
  upsertRecord,
  queryRecords,
  deleteRecord,
  getRecord,
  STORES,
  SYNC_STATUS,
  RECORD_TYPES,
} from "@/lib/offlineStorage";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Legacy DB Interface (kept for migration)
// ---------------------------------------------------------------------------

const DB_NAME = "offline-sync";
const STORE_NAME = "pending-actions";
const DB_VERSION = 1;

/**
 * Get the legacy offline DB (used by existing tests and some consumers).
 * @deprecated Use getUnifiedDb() from lib/offlineStorage.js instead.
 */
export async function getOfflineDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("student-labels")) {
        db.createObjectStore("student-labels", { keyPath: "id" });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Unified API (delegates to lib/offlineStorage.js)
// ---------------------------------------------------------------------------

/**
 * Add a pending action to offline storage.
 * Internally creates a unified OfflineRecord.
 */
export async function addPendingAction(action) {
  try {
    await upsertRecord({
      type: action.type === "attendance"
        ? RECORD_TYPES.ATTENDANCE
        : action.type === "complaint"
          ? RECORD_TYPES.COMPLAINT
          : action.type === "exception"
            ? RECORD_TYPES.GENERAL
            : RECORD_TYPES.GENERAL,
      collection: action.endpoint?.split("/").filter(Boolean).pop() || "general",
      data: action,
      vectorClock: { offline: 1 },
    });
  } catch (error) {
    // Fallback to legacy DB if unified storage fails
    logger.warn("[OfflineStore] Unified storage failed, using legacy:", error);
    const db = await getOfflineDb();
    await db.add(STORE_NAME, {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending",
      ...action,
    });
  }
}

/**
 * Get all pending actions.
 */
export async function getPendingActions() {
  try {
    const records = await queryRecords({ status: SYNC_STATUS.PENDING });
    return records.map((r) => ({
      ...r.data,
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      retryCount: r.retryCount,
    }));
  } catch (error) {
    // Fallback to legacy DB
    const db = await getOfflineDb();
    return db.getAllFromIndex(STORE_NAME, "status", "pending");
  }
}

/**
 * Update the status of an action.
 */
export async function updateActionStatus(id, status, retryCount = 0) {
  try {
    const record = await getRecord(id);
    if (record) {
      const db = await getUnifiedDb();
      const tx = db.transaction(STORES.RECORDS, "readwrite");
      const store = tx.objectStore(STORES.RECORDS);
      const rec = await store.get(id);
      if (rec) {
        rec.status = status === "pending" ? SYNC_STATUS.PENDING
          : status === "synced" ? SYNC_STATUS.SYNCED
          : status === "failed" ? SYNC_STATUS.FAILED
          : status;
        rec.retryCount = retryCount;
        await store.put(rec);
      }
      await tx.done;
    }
  } catch (error) {
    // Fallback to legacy DB
    const db = await getOfflineDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const action = await store.get(id);
    if (action) {
      action.status = status;
      action.retryCount = retryCount;
      await store.put(action);
    }
    await tx.done;
  }
}

/**
 * Remove an action by ID.
 */
export async function removePendingAction(id) {
  try {
    await deleteRecord(id);
  } catch (error) {
    const db = await getOfflineDb();
    await db.delete(STORE_NAME, id);
  }
}

/**
 * Clear all pending actions.
 */
export async function clearPendingActions() {
  try {
    const records = await queryRecords({});
    for (const record of records) {
      await deleteRecord(record.id);
    }
  } catch (error) {
    const db = await getOfflineDb();
    await db.clear(STORE_NAME);
  }
}

// ---------------------------------------------------------------------------
// Student Labels (unchanged – not part of sync)
// ---------------------------------------------------------------------------

export async function saveLabelsToOfflineStore(labels) {
  try {
    const db = await getOfflineDb();
    const tx = db.transaction("student-labels", "readwrite");
    const store = tx.objectStore("student-labels");
    await store.put({
      id: "cached-labels",
      data: labels,
      updatedAt: Date.now(),
    });
    await tx.done;
  } catch (err) {
    console.warn("Failed to cache labels offline:", err);
  }
}

export async function getLabelsFromOfflineStore() {
  try {
    const db = await getOfflineDb();
    const record = await db.get("student-labels", "cached-labels");
    return record ? record.data : [];
  } catch (err) {
    console.warn("Failed to retrieve offline labels:", err);
    return [];
  }
}
