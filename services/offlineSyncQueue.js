import { openDB } from "idb";
import { logger } from "@/lib/logger";

const DB_NAME = "learnova-offline-sync-db";
const STORE_NAME = "attendance_queue";

/**
 * Initializes the IndexedDB for offline attendance storage.
 */
export async function initOfflineDB() {
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
        // Existing store — add the compound index that was missing before v2
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.store.createIndex("userId_date", ["userId", "date"], { unique: false });
      }
    },
  });
}

/**
 * Adds an attendance record to the offline IndexedDB queue.
 * If a pending record for the same userId + date already exists, the
 * existing record's ID is returned and no duplicate is inserted.
 * @param {Object} record - The attendance data (userId, studentName, etc.)
 */
export async function queueOfflineAttendance(record) {
  try {
    const db = await initOfflineDB();

    // Deduplication: check for an existing pending record with the same
    // userId and date before inserting to avoid double-syncing.
    if (record.userId && record.date) {
      const tx = db.transaction(STORE_NAME, "readonly");
      const existing = await tx.store
        .index("userId_date")
        .getAll(IDBKeyRange.only([record.userId, record.date]));
      await tx.done;

      const pendingDuplicate = existing.find((r) => r.status === "pending");
      if (pendingDuplicate) {
        logger.info(
          `[Offline Sync] Duplicate skipped — record already queued with ID: ${pendingDuplicate.id}`
        );
        return pendingDuplicate.id;
      }
    }

    const id = await db.add(STORE_NAME, {
      ...record,
      status: "pending",
      timestamp: Date.now(),
    });
    logger.info(`[Offline Sync] Queued attendance record ID: ${id}`);
    return id;
  } catch (error) {
    logger.error("[Offline Sync] Failed to queue record:", { error });
    throw error;
  }
}

/**
 * Retrieves all pending attendance records from the offline queue.
 */
export async function getPendingOfflineRecords() {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.store.index("status");
    return await index.getAll("pending");
  } catch (error) {
    logger.error("[Offline Sync] Failed to fetch pending records:", { error });
    return [];
  }
}

/**
 * Marks a record as synced to prevent it from being processed again.
 * Optionally, we can just delete it, but marking is safer for auditing.
 * @param {number} id - The ID of the record.
 */
export async function markRecordAsSynced(id) {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.store;
    const record = await store.get(id);
    if (record) {
      record.status = "synced";
      record.syncedAt = Date.now();
      await store.put(record);
    }
    await tx.done;
  } catch (error) {
    logger.error(`[Offline Sync] Failed to mark record ${id} as synced:`, { error });
  }
}

/**
 * Removes a record from the offline queue.
 * @param {number} id - The ID of the record.
 */
export async function removeRecordFromQueue(id) {
  try {
    const db = await initOfflineDB();
    await db.delete(STORE_NAME, id);
  } catch (error) {
    logger.error(`[Offline Sync] Failed to delete record ${id}:`, { error });
  }
}

/**
 * Counts the number of pending records.
 */
export async function getPendingRecordsCount() {
  const records = await getPendingOfflineRecords();
  return records.length;
}

/**
 * Flushes the offline queue by attempting to sync all pending records to the server.
 * This should be called when the application detects it is back online.
 * @param {Function} syncCallback - A callback function that takes a record and returns a Promise resolving to success.
 */
export async function syncOfflineQueue(syncCallback) {
  if (!navigator.onLine) {
    logger.warn("[Offline Sync] Cannot sync, device is currently offline.");
    return { success: false, synced: 0, failed: 0 };
  }

  const pendingRecords = await getPendingOfflineRecords();
  if (pendingRecords.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }

  logger.info(`[Offline Sync] Attempting to sync ${pendingRecords.length} records...`);
  
  let syncedCount = 0;
  let failedCount = 0;

  for (const record of pendingRecords) {
    try {
      // Call the provided callback to actually send data to the backend
      const success = await syncCallback(record);
      
      if (success) {
        await removeRecordFromQueue(record.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch (err) {
      logger.error(`[Offline Sync] Error syncing record ${record.id}:`, { err });
      failedCount++;
    }
  }

  logger.info(`[Offline Sync] Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}`);
  
  return {
    success: failedCount === 0,
    synced: syncedCount,
    failed: failedCount
  };
}
