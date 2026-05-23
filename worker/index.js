import { openDB } from "idb";

const DB_NAME = "learnova_offline_db";
const STORE_NAME = "attendance_outbox";
const DB_VERSION = 1;

async function getOutboxRecords() {
  const db = await openDB(DB_NAME, DB_VERSION);
  return db.getAll(STORE_NAME);
}

async function removeFromOutbox(id) {
  const db = await openDB(DB_NAME, DB_VERSION);
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

async function syncAttendanceSW() {
  const records = await getOutboxRecords();
  if (records.length === 0) return;

  try {
    const response = await fetch("/api/attendance/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Credentials same-origin ensures cookies (like authToken) are sent!
      credentials: "same-origin",
      body: JSON.stringify({ records }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.syncedIds) {
        for (const id of data.syncedIds) {
          await removeFromOutbox(id);
        }
        
        // Notify any open clients that sync completed
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({ type: "SYNC_COMPLETE", count: data.syncedIds.length });
        });
      }
    }
  } catch (error) {
    console.error("[Service Worker] Error during background sync:", error);
    throw error; // throw to let the browser retry later
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-attendance") {
    console.log("[Service Worker] Handling sync-attendance event");
    event.waitUntil(syncAttendanceSW());
  }
});
