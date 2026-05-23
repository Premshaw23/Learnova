import { openDB } from "idb";

const DB_NAME = "learnova_offline_db";
const STORE_NAME = "attendance_outbox";
const DB_VERSION = 1;

export async function initDB() {
  if (typeof window === "undefined") return null;
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // create index on userId for deduplication or querying if needed
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("date", "date", { unique: false });
      }
    },
  });
}

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
