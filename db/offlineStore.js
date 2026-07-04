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
      if (!db.objectStoreNames.contains("student-labels")) {
        db.createObjectStore("student-labels", { keyPath: "id" });
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
