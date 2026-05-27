import { initDB, ATTENDANCE_STORE } from "./offlineQueue";

const STORE_NAME = ATTENDANCE_STORE;

export { initDB };

/**
 * Saves an attendance record to the IndexedDB outbox.
 * @param {Object} record - The attendance payload
 */
export async function saveToOutbox(record) {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  record.queuedAt = Date.now();
  await store.add(record);
  await tx.done;
}

/**
 * Retrieves all queued attendance records.
 * @returns {Promise<Array>} Array of records
 */
export async function getOutboxRecords() {
  const db = await initDB();
  if (!db) return [];
  return db.getAll(STORE_NAME);
}

/**
 * Removes a specific record from the outbox by ID.
 * @param {number} id - The record ID
 */
export async function removeFromOutbox(id) {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

/**
 * Clears the entire outbox.
 */
export async function clearOutbox() {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}
