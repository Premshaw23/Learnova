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

  const BATCH_SIZE = 50;
  let totalSynced = 0;

  try {
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);

      const response = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Credentials same-origin ensures cookies (like authToken) are sent!
        credentials: "same-origin",
        body: JSON.stringify({ records: batch }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          for (const id of data.syncedIds ?? []) {
            await removeFromOutbox(id);
          }
          totalSynced += data.syncedIds?.length ?? 0;
          for (const id of data.rejectedIds ?? []) {
            await removeFromOutbox(id);
          }
        }
      } else {
        throw new Error(`Failed to sync batch: ${response.status} ${response.statusText}`);
      }
    }

    if (totalSynced > 0) {
      // Notify any open clients that sync completed
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({ type: "SYNC_COMPLETE", count: totalSynced });
      });
    }
  } catch (error) {
    console.error("[Service Worker] Error during background sync:", error);
    throw error;
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(async () => {
          const cached = await caches.match("/offline.html");
          return cached || new Response("You are offline", {
            headers: { "Content-Type": "text/html" },
          });
        })
    );
  }
});
