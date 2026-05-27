/** @type {Map<string, { objectUrl: string, expiresAt: number }>} */
const memoryCache = new Map();

const MAX_ENTRIES = 64;
const TTL_MS = 30 * 60 * 1000;

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) {
      URL.revokeObjectURL(entry.objectUrl);
      memoryCache.delete(key);
    }
  }
}

function evictOldestIfNeeded() {
  if (memoryCache.size < MAX_ENTRIES) {
    return;
  }
  const firstKey = memoryCache.keys().next().value;
  if (firstKey) {
    const entry = memoryCache.get(firstKey);
    if (entry?.objectUrl) {
      URL.revokeObjectURL(entry.objectUrl);
    }
    memoryCache.delete(firstKey);
  }
}

/**
 * @param {string} src
 * @returns {string|null}
 */
export function getCachedAvatarObjectUrl(src) {
  if (!src || typeof src !== "string") {
    return null;
  }

  evictExpired();
  const entry = memoryCache.get(src);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    URL.revokeObjectURL(entry.objectUrl);
    memoryCache.delete(src);
    return null;
  }

  return entry.objectUrl;
}

/**
 * @param {string} src
 * @param {string} objectUrl
 */
export function setCachedAvatarObjectUrl(src, objectUrl) {
  if (!src || !objectUrl) {
    return;
  }

  evictExpired();
  const existing = memoryCache.get(src);
  if (existing?.objectUrl && existing.objectUrl !== objectUrl) {
    URL.revokeObjectURL(existing.objectUrl);
  }

  evictOldestIfNeeded();
  memoryCache.set(src, {
    objectUrl,
    expiresAt: Date.now() + TTL_MS,
  });
}

/**
 * @param {string} [src] - omit to clear all
 */
export function invalidateCachedAvatar(src) {
  if (!src) {
    for (const entry of memoryCache.values()) {
      URL.revokeObjectURL(entry.objectUrl);
    }
    memoryCache.clear();
    return;
  }

  const entry = memoryCache.get(src);
  if (entry?.objectUrl) {
    URL.revokeObjectURL(entry.objectUrl);
  }
  memoryCache.delete(src);
}

/**
 * Prefetch an authenticated avatar into the memory cache.
 * @param {string} src
 * @param {() => Promise<string|null|undefined>} getToken
 */
export async function prefetchAuthenticatedAvatar(src, getToken) {
  if (!src || getCachedAvatarObjectUrl(src)) {
    return;
  }

  try {
    const token = await getCachedIdToken(getToken);
    const response = await fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });

    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    setCachedAvatarObjectUrl(src, objectUrl);
  } catch {
    // silent — display hook will retry
  }
}

let tokenCache = { token: null, expiresAt: 0 };

/**
 * Reuse Firebase ID tokens across avatar fetches (tokens valid ~1h).
 * @param {() => Promise<string|null|undefined>} getToken
 */
export async function getCachedIdToken(getToken) {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }

  const token = (await getToken?.()) || null;
  tokenCache = {
    token,
    expiresAt: now + 55 * 60 * 1000,
  };
  return token;
}

export function clearIdTokenCache() {
  tokenCache = { token: null, expiresAt: 0 };
}
