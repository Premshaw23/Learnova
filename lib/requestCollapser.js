/**
 * lib/requestCollapser.js
 * Centralized utility to prevent redundant API calls during dashboard mounting.
 */

const pendingRequests = new Map();
const cache = new Map();
const TTL = 5000; // 5 seconds cache

export async function collapseRequest(key, fetcher) {
  // 1. Check Cache: Return cached data if it's within the 5-second TTL
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (Date.now() - timestamp < TTL) {
      return data;
    }
    cache.delete(key); // Clear stale cache
  }

  // 2. Check Pending: If a request is already flying, return its promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  // 3. Execute and Store: Fire the fetcher, cache the result, and cleanup
  const requestPromise = fetcher()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, requestPromise);
  return requestPromise;
}