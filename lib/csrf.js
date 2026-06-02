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
  // Prefer an explicit override. This helps in staging/test and reverse-proxy setups.
  // If CSRF_COOKIE_SECURE is set to "true"/"false", it wins.
  const explicitSecure = process.env.CSRF_COOKIE_SECURE;
  const secure =
    explicitSecure === "true" ? true : explicitSecure === "false" ? false : true;

  // Default behavior is secure-by-default.
  // If you truly need HTTP-only cookies for local development, set:
  //   CSRF_COOKIE_SECURE=false
  return {
    httpOnly: false,
    sameSite: "lax",
    secure,
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

function getTrustedAppOrigin(request) {
  // Best effort: middleware request has nextUrl.origin.
  // If unavailable (non-standard runtimes), callers should set
  // CSRF_TRUSTED_ORIGIN.
  return request?.nextUrl?.origin || process.env.CSRF_TRUSTED_ORIGIN || null;
}

function getHeaderOrigin(requestHeaders) {
  const origin = requestHeaders?.get("origin") || requestHeaders?.get("Origin") || null;
  return origin;
}

function getRefererHost(requestHeaders) {
  const referer = requestHeaders?.get("referer") || requestHeaders?.get("Referer") || null;
  if (!referer) return null;

  try {
    return new URL(referer).host;
  } catch {
    return null;
  }
}

function isTrustedRequestOrigin(request) {
  if (!isUnsafeMethod(request.method)) return true;

  const trustedOrigin = getTrustedAppOrigin(request);
  if (!trustedOrigin) {
    // Without a trusted origin, fail closed to avoid weakening CSRF checks.
    const error = new Error("Forbidden: CSRF trusted origin is not configured");
    error.statusCode = 403;
    throw error;
  }

  const requestHeaders = request.headers;
  const originHeader = getHeaderOrigin(requestHeaders);
  if (originHeader) {
    return originHeader === trustedOrigin;
  }

  // Origin header can be absent for some clients; use Referer as a fallback.
  const refererHost = getRefererHost(requestHeaders);
  if (!refererHost) return false;

  try {
    const trustedHost = new URL(trustedOrigin).host;
    return refererHost === trustedHost;
  } catch {
    return false;
  }
}

export function validateCsrfOriginAndReferer(request) {
  if (!isUnsafeMethod(request.method)) return;

  const allowed = isTrustedRequestOrigin(request);
  if (!allowed) {
    const error = new Error("Forbidden: invalid Origin/Referer");
    error.statusCode = 403;
    throw error;
  }
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
