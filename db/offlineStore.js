import { openDB } from "idb";

const DB_NAME = "offline-sync";
const STORE_NAME = "pending-actions";
const DB_VERSION = 1;

export async function getOfflineDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("status", "status");
        store.createIndex("createdAt", "createdAt");
      }
    },
  });
}

export async function addPendingAction(action) {
  const db = await getOfflineDb();
  await db.add(STORE_NAME, {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
    ...action,
  });
}

export async function getPendingActions() {
  const db = await getOfflineDb();
  return db.getAllFromIndex(STORE_NAME, "status", "pending");
}

export async function updateActionStatus(id, status, retryCount = 0) {
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

export async function removePendingAction(id) {
  const db = await getOfflineDb();
  await db.delete(STORE_NAME, id);
}

export async function clearPendingActions() {
  const db = await getOfflineDb();
  await db.clear(STORE_NAME);
}
