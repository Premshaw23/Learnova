import { openDB } from "idb";

export const DB_NAME = "learnova_offline_db";
export const DB_VERSION = 2;
export const ATTENDANCE_STORE = "attendance_outbox";
export const MUTATIONS_STORE = "offline_mutations";

/**
 * Initializes the IndexedDB instance.
 * Handles upgrades backward-compatibly for versions 1 and 2.
 */
export async function initDB() {
  if (typeof indexedDB === "undefined") return null;
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(ATTENDANCE_STORE)) {
          const store = db.createObjectStore(ATTENDANCE_STORE, { keyPath: "id", autoIncrement: true });
          store.createIndex("userId", "userId", { unique: false });
          store.createIndex("date", "date", { unique: false });
        }
      }
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains(MUTATIONS_STORE)) {
          db.createObjectStore(MUTATIONS_STORE, { keyPath: "id", autoIncrement: true });
        }
      }
    },
  });
}

/**
 * Adds a mutation request to the offline queue.
 * @param {Object} requestInfo - The request metadata and body to store
 */
export async function queueMutation(requestInfo) {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction(MUTATIONS_STORE, "readwrite");
  const store = tx.objectStore(MUTATIONS_STORE);

  await store.add({
    ...requestInfo,
    queuedAt: Date.now(),
    retryCount: 0,
    status: "pending",
    lastError: null,
  });

  await tx.done;
}

/**
 * Retrieves all queued mutation requests.
 * @returns {Promise<Array>} List of queued requests
 */
export async function removeQueuedMutation(id) {
  const db = await initDB();
  if (!db) return;

  const tx = db.transaction(MUTATIONS_STORE, "readwrite");
  const store = tx.objectStore("mutations");

  await store.delete(id);

  return tx.complete;
}

/**
 * Clears all mutation requests from the queue.
 */
export async function clearQueuedMutations() {
  const db = await initDB();
  if (!db) return;
  const tx = db.transaction(MUTATIONS_STORE, "readwrite");
  await tx.objectStore(MUTATIONS_STORE).clear();
  await tx.done;
}

/**
 * Get all queued mutation requests.
 * Used by syncService and OfflineIndicator.
 */
export async function getQueuedMutations() {
  const db = await initDB();
  if (!db) return [];

  return db.getAll(MUTATIONS_STORE);
}

/**
 * Update queue item status
 */
export async function updateMutationStatus(id, status) {
  const db = await initDB();
  if (!db) return;

  const item = await db.get(MUTATIONS_STORE, id);

  if (!item) return;

  item.status = status;

  await db.put(MUTATIONS_STORE, item);
}

/**
 * Increment retry count
 */
export async function incrementRetryCount(id) {
  const db = await initDB();
  if (!db) return;

  const item = await db.get(MUTATIONS_STORE, id);

  if (!item) return;

  item.retryCount = (item.retryCount || 0) + 1;

  await db.put(MUTATIONS_STORE, item);
}

/**
 * Get pending mutations count
 */
export async function getPendingMutationsCount() {
  const db = await initDB();

  if (!db) return 0;

  const items = await db.getAll(MUTATIONS_STORE);

  return items.filter(
    (item) => item.status === "pending"
  ).length;
}