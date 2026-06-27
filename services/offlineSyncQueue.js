import { openDB } from "idb";
import { logger } from "@/lib/logger";

const DB_NAME = "learnova-offline-sync-db";
const STORE_NAME = "attendance_queue";

/**
 * Helper to get or generate a device ID.
 */
function getDeviceId() {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("learnova_device_id");
  if (!deviceId) {
    deviceId = `device_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("learnova_device_id", deviceId);
  }
  return deviceId;
}

/**
 * Initializes the IndexedDB for offline attendance storage.
 */
export async function initOfflineDB() {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("status", "status", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("userId_date", ["userId", "date"], { unique: false });
        store.createIndex("student_class_session_date", ["userId", "classId", "sessionId", "date"], { unique: false });
      } else {
        const store = db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);
        if (oldVersion < 2 && !store.indexNames.contains("userId_date")) {
          store.createIndex("userId_date", ["userId", "date"], { unique: false });
        }
        if (oldVersion < 3 && !store.indexNames.contains("student_class_session_date")) {
          store.createIndex("student_class_session_date", ["userId", "classId", "sessionId", "date"], { unique: false });
        }
      }
    },
  });
}

/**
 * Adds an attendance record to the offline IndexedDB queue.
 * Enforces one student + one class + one session = only one record.
 * @param {Object} record - The attendance data (userId, studentName, etc.)
 */
export async function queueOfflineAttendance(record) {
  try {
    const db = await initOfflineDB();

    const userId = record.userId || "";
    const date = record.date || "";
    const classId = record.classId || "default_class";
    const sessionId = record.sessionId || "default_session";
    const studentId = record.studentId || userId;
    const deviceId = record.deviceId || getDeviceId();
    const attendanceId = record.attendanceId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `att_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`);
    const version = record.version || 1;
    const lastUpdated = record.lastUpdated || Date.now();

    // Deduplication check: check for pending record with same userId, classId, sessionId, date
    if (userId && date) {
      const tx = db.transaction(STORE_NAME, "readonly");
      const existing = await tx.store
        .index("student_class_session_date")
        .getAll(IDBKeyRange.only([userId, classId, sessionId, date]));
      await tx.done;

      const pendingDuplicate = existing.find((r) => r.status === "pending");
      if (pendingDuplicate) {
        logger.info(
          `[Offline Sync] Duplicate skipped — record already queued with ID: ${pendingDuplicate.id}`
        );
        return pendingDuplicate.id;
      }
    }

    const enrichedRecord = {
      ...record,
      userId,
      date,
      classId,
      sessionId,
      studentId,
      deviceId,
      attendanceId,
      version,
      lastUpdated,
      status: "pending",
      syncStatus: "pending",
      timestamp: lastUpdated,
    };

    const id = await db.add(STORE_NAME, enrichedRecord);
    logger.info(`[Offline Sync] Queued attendance record ID: ${id} (attendanceId: ${attendanceId})`);
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
      record.syncStatus = "synced";
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
 * Ensures sequential processing and status check.
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

  // Sort pending records chronologically by lastUpdated to process them sequentially in order
  pendingRecords.sort((a, b) => a.lastUpdated - b.lastUpdated);

  logger.info(`[Offline Sync] Attempting to sync ${pendingRecords.length} records sequentially...`);
  
  let syncedCount = 0;
  let failedCount = 0;

  for (const record of pendingRecords) {
    // Re-check online status sequentially
    if (!navigator.onLine) {
      logger.warn("[Offline Sync] Sync interrupted: device went offline.");
      break;
    }

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

