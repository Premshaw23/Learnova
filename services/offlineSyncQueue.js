import { openDB } from "idb";

const DB_NAME = "learnova-offline-sync-db";
const STORE_NAME = "attendance_queue";
const PROGRESS_STORE_NAME = "progress_queue";
const DB_VERSION = 2;

/**
 * Initializes the IndexedDB for offline storage.
 */
export async function initOfflineDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
      if (!db.objectStoreNames.contains(PROGRESS_STORE_NAME)) {
        const store = db.createObjectStore(PROGRESS_STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    },
  });
}

/**
 * Adds an attendance record to the offline IndexedDB queue.
 * @param {Object} record - The attendance data (userId, studentName, etc.)
 */
export async function queueOfflineAttendance(record) {
  try {
    const db = await initOfflineDB();
    const id = await db.add(STORE_NAME, {
      ...record,
      status: "pending",
      timestamp: Date.now(),
    });
    console.log(`[Offline Sync] Queued attendance record ID: ${id}`);
    return id;
  } catch (error) {
    console.error("[Offline Sync] Failed to queue record:", error);
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
    console.error("[Offline Sync] Failed to fetch pending records:", error);
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
    console.error(`[Offline Sync] Failed to mark record ${id} as synced:`, error);
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
    console.error(`[Offline Sync] Failed to delete record ${id}:`, error);
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
    console.warn("[Offline Sync] Cannot sync, device is currently offline.");
    return { success: false, synced: 0, failed: 0 };
  }

  const pendingRecords = await getPendingOfflineRecords();
  if (pendingRecords.length === 0) {
    return { success: true, synced: 0, failed: 0 };
  }

  console.log(`[Offline Sync] Attempting to sync ${pendingRecords.length} records...`);
  
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
      console.error(`[Offline Sync] Error syncing record ${record.id}:`, err);
      failedCount++;
    }
  }

  console.log(`[Offline Sync] Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}`);
  
  return {
    success: failedCount === 0,
    synced: syncedCount,
    failed: failedCount
  };
}

/**
 * Adds a course progress record to the offline IndexedDB queue.
 * @param {Object} record - The progress data (courseId, currentModuleId, progress, timestamp)
 */
export async function queueOfflineProgress(record) {
  try {
    const db = await initOfflineDB();
    const id = await db.add(PROGRESS_STORE_NAME, {
      ...record,
      status: "pending",
      timestamp: Date.now(),
      retryCount: 0,
    });
    console.log(`[Offline Progress Sync] Queued progress record ID: ${id}`);
    return id;
  } catch (error) {
    console.error("[Offline Progress Sync] Failed to queue record:", error);
    throw error;
  }
}

/**
 * Retrieves all pending progress records from the offline queue.
 */
export async function getPendingOfflineProgress() {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(PROGRESS_STORE_NAME, "readonly");
    const index = tx.store.index("status");
    return await index.getAll("pending");
  } catch (error) {
    console.error("[Offline Progress Sync] Failed to fetch pending records:", error);
    return [];
  }
}

/**
 * Removes a progress record from the offline queue.
 * @param {number} id - The ID of the record.
 */
export async function removeProgressFromQueue(id) {
  try {
    const db = await initOfflineDB();
    await db.delete(PROGRESS_STORE_NAME, id);
  } catch (error) {
    console.error(`[Offline Progress Sync] Failed to delete record ${id}:`, error);
  }
}

/**
 * Updates retryCount for a progress record.
 */
export async function updateProgressRetryCount(id, retryCount) {
  try {
    const db = await initOfflineDB();
    const tx = db.transaction(PROGRESS_STORE_NAME, "readwrite");
    const store = tx.store;
    const record = await store.get(id);
    if (record) {
      record.retryCount = retryCount;
      await store.put(record);
    }
    await tx.done;
  } catch (error) {
    console.error(`[Offline Progress Sync] Failed to update retryCount for progress record ${id}:`, error);
  }
}

/**
 * Counts the number of pending progress records.
 */
export async function getPendingProgressCount() {
  const records = await getPendingOfflineProgress();
  return records.length;
}
