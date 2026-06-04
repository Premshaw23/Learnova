import { processSyncQueue } from "../services/syncQueue";

let csrfTokenCache = null; // { token: string, fetchedAt: number }
let csrfTokenPromise = null;
const CSRF_TOKEN_TTL_MS = 6 * 24 * 60 * 60 * 1000; // 6 days (1 day before cookie expiry)

const MAX_RETRIES = 5;
const INITIAL_DELAY = 1000; // 1 second

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
    .finally(() => { csrfTokenPromise = null; });

  return csrfTokenPromise;
}

async function swFetchWithCsrf(url, options = {}) {
  const method = options.method || "GET";
  const headers = new Headers(options.headers || {});
  
  if (isUnsafeMethod(method) && isSameOriginApiUrl(url)) {
    if (!headers.has("x-csrf-token") && !headers.has("X-CSRF-Token")) {
      const token = await getCsrfToken();
      if (token) headers.set("X-CSRF-Token", token);
    }
  }
  
  return fetch(url, { ...options, headers });
}

async function handleSync() {
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: "SYNC_PENDING_ACTIONS_START" }));
  
  let attempt = 0;
  let delay = INITIAL_DELAY;
  let result = null;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    try {
      result = await processSyncQueue(swFetchWithCsrf);
      
      // If result has failed items (e.g., 500 API errors), retry the batch
      if (result && result.failCount > 0) {
        throw new Error(`Sync queue processing failed items count: ${result.failCount}`);
      }
      
      // Successful sync execution path
      clients.forEach(c => c.postMessage({ 
        type: "SYNC_PENDING_ACTIONS_COMPLETE", 
        successCount: result.successCount, 
        failCount: 0 
      }));
      return;
    } catch (error) {
      attempt++;
      lastError = error;
      
      if (attempt >= MAX_RETRIES) {
        break; // Out of retry attempts
      }
      
      // Wait for the double exponential delay time spacing before attempting again
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  // Handle ultimate failure execution state after retries run dry
  clients.forEach(c => c.postMessage({ 
    type: "SYNC_PENDING_ACTIONS_FAILED_PERMANENTLY", 
    message: "Background synchronization failed permanently after retry limits. Please refresh or retry manually.",
    failCount: result ? result.failCount : 1
  }));
  
  throw lastError || new Error("Sync execution failed permanently.");
}

const CACHE_NAME = "learnova-api-cache-v1";
const CACHE_MAX_ENTRIES = 200;
const ANONYMOUS_USER_PREFIX = "anon";
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending-actions") {
    event.waitUntil(handleSync().catch(err => console.error("[SW] Background sync failed:", err)));
  }
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TRIGGER_SYNC_PENDING_ACTIONS") {
    event.waitUntil(handleSync().catch(err => console.error("[SW] Message sync failed:", err)));
  } else if (event.data && event.data.type === "CLEAR_USER_CACHE") {
    const userHash = event.data.userHash;
    if (userHash) {
      event.waitUntil(clearCacheForUser(userHash).catch(err => console.error("[SW] Clear user cache failed:", err)));
    } else {
      event.waitUntil(clearUserCaches().catch(err => console.error("[SW] Clear all caches failed:", err)));
    }
  }
});

function getUserHashFromRequest(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const authTokenMatch = cookieHeader.match(/(?:^|;\s*)authToken=([^;]+)/);
  if (!authTokenMatch) return null;
  const token = authTokenMatch[1];
  return token.slice(0, 16);
}

function buildCacheKey(url, userHash) {
  const suffix = userHash || ANONYMOUS_USER_PREFIX;
  return `${url}__uid__${suffix}`;
}

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length > CACHE_MAX_ENTRIES) {
    const toDelete = keys.slice(0, keys.length - CACHE_MAX_ENTRIES);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

async function clearCacheForUser(userHash) {
  const cache = await caches.open(CACHE_NAME);
  const keys = await cache.keys();
  const userPattern = `__uid__${userHash}`;
  await Promise.all(
    keys
      .filter((request) => request.url.includes(userPattern))
      .map((request) => cache.delete(request)),
  );
}

async function clearUserCaches() {
  const cacheNames = await caches.keys();
  const apiCaches = cacheNames.filter((name) => name.startsWith("learnova-api-cache"));
  await Promise.all(apiCaches.map((name) => caches.delete(name)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method === "GET" && request.url.includes("/api/") && !request.url.includes("/api/auth/")) {
    event.respondWith(
      (async () => {
        const userHash = getUserHashFromRequest(request);
        const cacheKey = buildCacheKey(request.url, userHash);
        const cache = await caches.open(CACHE_NAME);

        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cloned = networkResponse.clone();
            const cachePutPromise = cache.put(cacheKey, cloned).then(() => trimCache(cache));
            event.waitUntil(cachePutPromise.catch(err => console.error("[SW] Cache put failed:", err)));
          }
          return networkResponse;
        } catch {
          const offlineResponse = await cache.match(cacheKey);
          return offlineResponse || new Response("You are offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match("/offline.html");
        return cached || new Response("You are offline", { headers: { "Content-Type": "text/plain" } });
      })
    );
  }
});
