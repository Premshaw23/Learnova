const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getCryptoSource() {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
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
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export function getCsrfCookieOptions() {
  // Prefer an explicit override. This helps in staging/test and reverse-proxy setups.
  // If CSRF_COOKIE_SECURE is set to "true"/"false", it wins.
  const explicitSecure = process.env.CSRF_COOKIE_SECURE;
  const secure =
    explicitSecure === "true"
      ? true
      : explicitSecure === "false"
        ? false
        : true;

  // Default behavior is secure-by-default.
  // If you truly need HTTP-only cookies for local development, set:
  //   CSRF_COOKIE_SECURE=false
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

let _csrfTokenCache = null;

export function getClientCsrfToken() {
  if (_csrfTokenCache) return _csrfTokenCache;

  if (typeof document === "undefined") {
    return null;
  }

  const cookiePrefix = `${CSRF_COOKIE_NAME}=`;
  const cookieParts = document.cookie ? document.cookie.split("; ") : [];

  for (const cookiePart of cookieParts) {
    if (cookiePart.startsWith(cookiePrefix)) {
      _csrfTokenCache = decodeURIComponent(
        cookiePart.slice(cookiePrefix.length)
      );
      return _csrfTokenCache;
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
    return (
      parsedUrl.origin === window.location.origin &&
      parsedUrl.pathname.startsWith("/api/")
    );
  } catch {
    return false;
  }
}

export function shouldAttachCsrfToken(url, method) {
  return isUnsafeMethod(method) && isSameOriginApiUrl(url);
}

export function getCsrfHeaderValue(requestHeaders) {
  if (!requestHeaders) return null;

  const targetHeaders = ["x-csrf-token", "x-xsrf-token", "x-csrftoken"];

  // Fast path for standard Fetch Headers.
  if (typeof requestHeaders.get === "function") {
    for (const headerName of targetHeaders) {
      const direct = requestHeaders.get(headerName);
      if (direct) return direct;
    }

    // Some runtimes/proxies may normalize header names differently or callers may
    // not pass a true Headers instance. Scan all entries case-insensitively.
    if (typeof requestHeaders.entries === "function") {
      for (const [name, value] of requestHeaders.entries()) {
        if (targetHeaders.includes(String(name).toLowerCase())) {
          return value;
        }
      }
    }

    return null;
  }

  // Fallback: plain object headers.
  if (typeof requestHeaders === "object") {
    for (const [key, value] of Object.entries(requestHeaders)) {
      if (targetHeaders.includes(key.toLowerCase())) {
        return value;
      }
    }
  }

  return null;
}

function getTrustedAppOrigin(request) {
  if (request?.nextUrl?.origin) {
    return request.nextUrl.origin;
  }
  if (process.env.CSRF_TRUSTED_ORIGIN) {
    return process.env.CSRF_TRUSTED_ORIGIN;
  }

  // Fallback: derive from request headers or request.url
  if (request) {
    const headers = request.headers;
    if (headers) {
      const proto =
        (headers.get("x-forwarded-proto")?.split(",")[0]?.trim()) ||
        (request.url && request.url.startsWith("https:") ? "https" : "http");
      const host =
        (headers.get("x-forwarded-host")?.split(",")[0]?.trim()) ||
        headers.get("host");

      if (host) {
        return `${proto}://${host}`;
      }
    }

    if (request.url) {
      try {
        const parsed = new URL(request.url);
        return parsed.origin;
      } catch {
        // ignore parsing errors
      }
    }
  }

  return null;
}

function getHeaderOrigin(requestHeaders) {
  const origin =
    requestHeaders?.get("origin") || requestHeaders?.get("Origin") || null;
  return origin;
}

function getRefererHost(requestHeaders) {
  const referer =
    requestHeaders?.get("referer") || requestHeaders?.get("Referer") || null;
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

  // Provide actionable diagnostics without loosening validation.
  if (!cookieToken) {
    const error = new Error("Forbidden: missing CSRF cookie");
    error.statusCode = 403;
    throw error;
  }

  if (!headerToken) {
    const error = new Error("Forbidden: missing CSRF header (x-csrf-token)");
    error.statusCode = 403;
    throw error;
  }

  // Normalize tokens to reduce false mismatches from transport/encoding quirks
  // (e.g., whitespace, accidental quoting). Also use constant-time comparison.
  const normalize = (v) =>
    typeof v === "string" ? v.trim().replace(/^"|"$/g, "") : v;
  const a = normalize(headerToken);
  const b = normalize(cookieToken);

  const safeEqual = (x, y) => {
    if (typeof x !== "string" || typeof y !== "string") return false;
    if (x.length !== y.length) return false;

    // Constant-time compare to avoid timing leaks.
    let diff = 0;
    for (let i = 0; i < x.length; i++) {
      diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
    }
    return diff === 0;
  };

  if (!safeEqual(a, b)) {
    const error = new Error("Forbidden: invalid CSRF token (mismatch)");
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

  try {
    const response = await fetchImpl("/api/auth/csrf", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.csrfToken) {
        _csrfTokenCache = data.csrfToken;
        return _csrfTokenCache;
      }
    }
  } catch {
    // Silently ignore fetch failures
  }

  return getClientCsrfToken();
}
