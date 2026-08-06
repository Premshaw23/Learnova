/**
 * ============================================================================
 * 🔄 OFFLINE SYNC QUEUE (Refactored for Issue #4224)
 * ============================================================================
 * Refactored to use the unified offline storage layer.
 * Maintains backward compatibility with existing API while adding:
 *   - Priority-ordered processing
 *   - Idempotency keys for deduplication
 *   - Queue size limits with oldest-first eviction
 *   - IndexedDB-backed persistence across browser restarts
 */

import {
  upsertRecord,
  getPendingRecords,
  queryRecords,
  deleteRecord,
  RECORD_TYPES,
  SYNC_STATUS,
  getUnifiedDb,
  STORES,
  getPendingCount,
} from "@/lib/offlineStorage";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_QUEUE_SIZE = 500;
const DB_NAME = "learnova-offline-sync-db";
const STORE_NAME = "attendance_queue";

// Priority mapping for backward compatibility
const TYPE_PRIORITY = {
  attendance: RECORD_TYPES.ATTENDANCE,
  quiz: RECORD_TYPES.QUIZ,
  activity: RECORD_TYPES.ACTIVITY,
  complaint: RECORD_TYPES.COMPLAINT,
  general: RECORD_TYPES.GENERAL,
};

// ---------------------------------------------------------------------------
// Legacy IndexedDB Interface (for migration)
// ---------------------------------------------------------------------------

/**
 * Initialises the legacy IndexedDB for offline attendance storage.
 * @deprecated Use getUnifiedDb() from lib/offlineStorage.js instead.
 */
export async function initOfflineDB() {
  const { openDB } = await import("idb");
  return openDB(DB_NAME, 2, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("userId_date", ["userId", "date"], { unique: false });
      } else if (oldVersion < 2) {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.store.createIndex("userId_date", ["userId", "date"], { unique: false });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Core Queue Operations (using unified storage)
// ---------------------------------------------------------------------------

/**
 * Adds an attendance record to the offline queue.
 * If a pending record for the same userId + date already exists, the
 * existing record's ID is returned and no duplicate is inserted.
 *
 * @param {Object} record - The attendance data (userId, studentName, etc.)
 * @returns {Promise<string>} The record ID
 */
export async function queueOfflineAttendance(record) {
  try {
    // Deduplication: check for an existing pending record
    if (record.userId && record.date) {
      const existing = await queryRecords({
        type: RECORD_TYPES.ATTENDANCE,
        status: SYNC_STATUS.PENDING,
      });

      const duplicate = existing.find(
        (r) => r.data?.userId === record.userId && r.data?.date === record.date
      );

      if (duplicate) {
        logger.info(
          `[Offline Sync] Duplicate skipped — record already queued with ID: ${duplicate.id}`
        );
        return duplicate.id;
      }
    }

    // Enforce queue size limit
    const pendingCount = await getPendingCount();
    if (pendingCount >= MAX_QUEUE_SIZE) {
      await evictOldestRecords(Math.ceil(MAX_QUEUE_SIZE * 0.1)); // Evict 10%
    }

    // Create unified record
    const unifiedRecord = await upsertRecord({
      type: RECORD_TYPES.ATTENDANCE,
      collection: "attendance",
      data: record,
      vectorClock: { [record.userId || "unknown"]: 1 },
    });

    logger.info(`[Offline Sync] Queued attendance record ID: ${unifiedRecord.id}`);
    return unifiedRecord.id;
  } catch (error) {
    logger.error("[Offline Sync] Failed to queue record:", { error });
    throw error;
  }
}

/**
 * Retrieves all pending attendance records from the offline queue.
 * @returns {Promise<Array>}
 */
export async function getPendingOfflineRecords() {
  try {
    const records = await queryRecords({
      type: RECORD_TYPES.ATTENDANCE,
      status: SYNC_STATUS.PENDING,
    });
    // Return in legacy format for backward compatibility
    return records.map((r) => ({
      ...r.data,
      id: r.id,
      status: r.status,
      timestamp: r.createdAt,
    }));
  } catch (error) {
    logger.error("[Offline Sync] Failed to fetch pending records:", { error });
    return [];
  }
}

/**
 * Marks a record as synced.
 * @param {string} id - The record ID (may be legacy numeric or new UUID)
 */
export async function markRecordAsSynced(id) {
  try {
    const db = await getUnifiedDb();
    const tx = db.transaction(STORES.RECORDS, "readwrite");
    const store = tx.objectStore(STORES.RECORDS);
    const rec = await store.get(id);
    if (rec) {
      rec.status = SYNC_STATUS.SYNCED;
      rec.syncedAt = Date.now();
      await store.put(rec);
    }
    await tx.done;
  } catch (error) {
    logger.error(`[Offline Sync] Failed to mark record ${id} as synced:`, {
      error,
    });
  }
}

/**
 * Removes a record from the offline queue.
 * @param {string} id - The record ID.
 */
export async function removeRecordFromQueue(id) {
  try {
    await deleteRecord(id);
  } catch (error) {
    logger.error(`[Offline Sync] Failed to delete record ${id}:`, { error });
  }
}

/**
 * Counts the number of pending records.
 */
export async function getPendingRecordsCount() {
  return getPendingCount();
}

/**
 * Flushes the offline queue by attempting to sync all pending records.
 * @param {Function} syncCallback - (record) => Promise<boolean>
 */
export async function syncOfflineQueue(syncCallback) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    logger.warn("[Offline Sync] Cannot sync, device is currently offline.");
    return { success: false, synced: 0, failed: 0 };
  }

  const pendingRecords = await getPendingOfflineRecords();
  if (pendingRecords.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }

  logger.info(
    `[Offline Sync] Attempting to sync ${pendingRecords.length} records...`
  );

  let syncedCount = 0;
  let failedCount = 0;

  for (const record of pendingRecords) {
    try {
      const success = await syncCallback(record);

      if (success) {
        await markRecordAsSynced(record.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      logger.error(`[Offline Sync] Error syncing record ${record.id}:`, {
        err,
      });
      failedCount++;
    }
  }

  logger.info(
    `[Offline Sync] Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}`
  );

  return {
    success: failedCount === 0,
    synced: syncedCount,
    failed: failedCount,
  };
}

// ---------------------------------------------------------------------------
// Queue Management Helpers
// ---------------------------------------------------------------------------

/**
 * Evict the oldest records when queue is full.
 */
async function evictOldestRecords(count) {
  const allPending = await getPendingRecords();
  // Sort by priority (highest number = lowest priority), then by oldest
  const toEvict = allPending
    .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
    .slice(0, count);

  for (const record of toEvict) {
    await deleteRecord(record.id);
    logger.warn(`[Offline Sync] Evicted record ${record.id} (queue limit)`);
  }
}

/**
 * Get all records with their sync status for UI display.
 */
export async function getQueueStatus() {
  const all = await queryRecords({});
  return {
    total: all.length,
    pending: all.filter((r) => r.status === SYNC_STATUS.PENDING).length,
    synced: all.filter((r) => r.status === SYNC_STATUS.SYNCED).length,
    conflict: all.filter((r) => r.status === SYNC_STATUS.CONFLICT).length,
    failed: all.filter((r) => r.status === SYNC_STATUS.FAILED).length,
  };
}
