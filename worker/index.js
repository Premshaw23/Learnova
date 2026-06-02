import { openDB } from "idb";

const DB_NAME = "learnova_offline_db";
const STORE_NAME = "attendance_outbox";
const MUTATIONS_STORE = "offline_mutations";
const DB_VERSION = 2;

let csrfTokenCache = null; // { token: string, fetchedAt: number }
let csrfTokenPromise = null;
const CSRF_TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (1 day before cookie expiry)

function isUnsafeMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase());
}

function clearCsrfCache() {
  csrfTokenCache = null;
}

function isSameOriginApiUrl(url) {
  try {
    const parsedUrl = new URL(url, self.location.origin);
    return parsedUrl.origin === self.location.origin && parsedUrl.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

async function getCsrfToken() {
  if (csrfTokenCache) {
    // Check if cached token has expired (6 days TTL)
    if (Date.now() - csrfTokenCache.fetchedAt < CSRF_TOKEN_TTL_MS) {
      return csrfTokenCache.token;
    }
    // Token expired, clear cache and fetch fresh
    csrfTokenCache = null;
  }

  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

csrfTokenPromise = fetch("/api/auth/csrf", {
  method: "GET",
  credentials: "same-origin",
  cache: "no-store",
})
.then(async (response) => {
  if (!response.ok) {
    return null;
  }

  const data = await response.json().catch(() => null);
  const csrfToken = data?.csrfToken || null;
  if (csrfToken) {
    csrfTokenCache = { token: csrfToken, fetchedAt: Date.now() };
  }
  return csrfToken;
})
    .catch(() => null)
    .finally(() => {
      csrfTokenPromise = null;
    });

  return csrfTokenPromise;
}

async function withCsrfHeaders(url, method, headers = {}) {
  if (!isUnsafeMethod(method) || !isSameOriginApiUrl(url)) {
    return headers;
  }

  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has("x-csrf-token")) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      nextHeaders.set("X-CSRF-Token", csrfToken);
    }
  }

  return nextHeaders;
}

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
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

async function getOutboxRecords() {
  const db = await getDb();
  return db.getAll(STORE_NAME);
}

async function removeFromOutbox(id) {
  const db = await getDb();
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
      let response = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: await withCsrfHeaders("/api/attendance/sync", "POST", {
          "Content-Type": "application/json",
        }),
        credentials: "same-origin",
        body: JSON.stringify({ records: batch }),
      });
      
      // Handle 403 by clearing CSRF cache and retrying once
      if (response.status === 403) {
        clearCsrfCache();
        response = await fetch("/api/attendance/sync", {
          method: "POST",
          headers: await withCsrfHeaders("/api/attendance/sync", "POST", {
            "Content-Type": "application/json",
          }),
          credentials: "same-origin",
          body: JSON.stringify({ records: batch }),
        });
      }
      
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

/**
 * Replays all queued mutation requests in IndexedDB sequentially.
 */
async function replayQueuedMutations() {
  const db = await getDb();
  const tx = db.transaction(MUTATIONS_STORE, "readonly");
  const store = tx.objectStore(MUTATIONS_STORE);
  const requests = await store.getAll();
  await tx.done;
  if (requests.length === 0) return;
  let successCount = 0;
  let failCount = 0;
  for (const req of requests) {
    try {
      let response = await fetch(req.url, {
        method: req.method,
        headers: await withCsrfHeaders(req.url, req.method, req.headers),
        body: req.body,
        credentials: "same-origin",
      });
      
      // Handle 403 by clearing CSRF cache and retrying once
      if (response.status === 403) {
        clearCsrfCache();
        response = await fetch(req.url, {
          method: req.method,
          headers: await withCsrfHeaders(req.url, req.method, req.headers),
          body: req.body,
          credentials: "same-origin",
        });
      }
      
      if (response.ok) {
        const writeTx = db.transaction(MUTATIONS_STORE, "readwrite");
        await writeTx.objectStore(MUTATIONS_STORE).delete(req.id);
        await writeTx.done;
        successCount++;
      } else {
        console.error(`[Service Worker] Replay failed for queued request ${req.url}: Status ${response.status}`);
        failCount++;
      }
     } catch (err) {
       console.error(`[Service Worker] Replay connection error for queued request ${req.url}:`, err);
       failCount++;
       // Stop processing the remaining requests if the network is still unreachable
       break;
     }
   }
   if (successCount > 0 || failCount > 0) {
     const clients = await self.clients.matchAll();
     clients.forEach((client) => {
       client.postMessage({
         type: "MUTATIONS_SYNC_COMPLETE",
         successCount,
         failCount,
       });
     });
   }
 }

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-attendance") {
    event.waitUntil(
      syncAttendanceSW().catch((error) => {
        console.error("[Service Worker] Background sync failed:", error);
      })
    );
  } else if (event.tag === "sync-offline-mutations") {
    event.waitUntil(replayQueuedMutations());
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_SYNC") {
    event.waitUntil(syncAttendanceSW());
  } else if (event.data && event.data.type === "TRIGGER_MUTATION_SYNC") {
    event.waitUntil(replayQueuedMutations());
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const isApi = request.url.includes("/api/");

  if (isMutation && isApi) {
    // Intercept mutation and queue it if the fetch request fails (network offline)
    event.respondWith(
      fetch(request.clone()).catch(async (error) => {
        try {
          const clonedRequest = request.clone();
          const bodyText = await clonedRequest.text();
          const headers = {};
          for (const [key, value] of request.headers.entries()) {
            headers[key] = value;
          }

          const db = await getDb();
          const tx = db.transaction(MUTATIONS_STORE, "readwrite");
          const store = tx.objectStore(MUTATIONS_STORE);
          await store.add({
            url: request.url,
            method: request.method,
            headers,
            body: bodyText,
            timestamp: Date.now(),
          });
          await tx.done;

          // Notify clients that a mutation has been queued
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: "MUTATION_QUEUED",
              url: request.url,
              method: request.method,
            });
          });

          return new Response(
            JSON.stringify({
              success: true,
              queuedOffline: true,
              message: "Network request failed. Queued for offline replay.",
            }),
            {
              status: 202,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (queueError) {
          console.error("[Service Worker] Failed to queue offline request:", queueError);
          throw error;
        }
      })
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/offline.html");
        return cached || new Response("You are offline", {
          headers: { "Content-Type": "text/html" },
        });
      })
    );
  }
});
