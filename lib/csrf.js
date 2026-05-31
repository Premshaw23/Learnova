const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCryptoSource() {
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === "function") {
    return globalThis.crypto;
  }

  return null;
}

export function generateCsrfToken() {
  const cryptoSource = getCryptoSource();
  if (!cryptoSource) {
    throw new Error("Crypto API is unavailable");
  }

  const bytes = new Uint8Array(32);
  cryptoSource.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function getClientCsrfToken() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${CSRF_COOKIE_NAME}=`;
  const cookieParts = document.cookie ? document.cookie.split("; ") : [];

  for (const cookiePart of cookieParts) {
    if (cookiePart.startsWith(cookiePrefix)) {
      return decodeURIComponent(cookiePart.slice(cookiePrefix.length));
    }
  }

  return null;
}

export function isUnsafeMethod(method) {
  return !SAFE_METHODS.has((method || "GET").toUpperCase());
}

export function isSameOriginApiUrl(url) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin === window.location.origin && parsedUrl.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

export function shouldAttachCsrfToken(url, method) {
  return isUnsafeMethod(method) && isSameOriginApiUrl(url);
}

export function getCsrfHeaderValue(requestHeaders) {
  if (!requestHeaders) {
    return null;
  }

  return (
    requestHeaders.get(CSRF_HEADER_NAME) ||
    requestHeaders.get("X-CSRF-Token") ||
    requestHeaders.get("x-csrf-token") ||
    null
  );
}

export function validateCsrfRequest(request) {
  if (!isUnsafeMethod(request.method)) {
    return;
  }

  const headerToken = getCsrfHeaderValue(request.headers);
  const cookieToken = request.cookies?.get(CSRF_COOKIE_NAME)?.value || null;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    const error = new Error("Forbidden: invalid CSRF token");
    error.statusCode = 403;
    throw error;
  }
}

export function createCsrfCookie(token = generateCsrfToken()) {
  return {
    name: CSRF_COOKIE_NAME,
    value: token,
    options: getCsrfCookieOptions(),
  };
}

export async function ensureClientCsrfToken(fetchImpl = globalThis.fetch) {
  if (typeof window === "undefined") {
    return null;
  }

  const existingToken = getClientCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  if (typeof fetchImpl !== "function") {
    return null;
  }

  await fetchImpl("/api/auth/csrf", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  }).catch(() => null);

  return getClientCsrfToken();
}
