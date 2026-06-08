import { NextResponse } from "next/server";
import * as jose from "jose";
import { Redis } from "@upstash/redis";
import { validateCsrfOriginAndReferer, validateCsrfRequest } from "@/lib/csrf";
import getApiRouteRule from "@/lib/rbac-policy";

let redisClient;

function getRedisClient() {
  if (
    !redisClient &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

// Allowed clock skew when validating JWT `exp` (seconds). Keep small to limit
// acceptance window for expired or revoked tokens.
const CLOCK_TOLERANCE_SECONDS = 60;

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Uses Upstash Redis (Vercel KV) as a centralized store so that rate limit
// state is shared across all serverless/edge instances, preventing bypass
// attacks. Falls back to per-instance memory only during local development.

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

// Dev-only in-memory fallback (never used in production)
const devRateLimitMap = new Map();

const AUTH_RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/verify-otp",
];

const PUBLIC_PATHS = ["/activity", "/auth", "/verify"];

function isAuthRoute(pathname) {
  return AUTH_RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
}

async function rateLimit(ip, pathname, request) {
  const cookies = typeof request.cookies?.get === "function" ? request.cookies : { get: () => undefined };
  const sessionFingerprint = cookies.get("__Secure-next-auth.session-token")?.value
    || cookies.get("next-auth.session-token")?.value
    || cookies.get("authToken")?.value
    || "";
  const key = `ratelimit:auth:${ip}_${pathname}_${sessionFingerprint.slice(0, 16)}`;
  const limit = RATE_LIMIT_MAX;
  const windowMs = RATE_LIMIT_WINDOW_MS;

  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedis) {
    try {
      const redis = getRedis();
      const now = Date.now();
      const windowStart = now - windowMs;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      multi.zcard(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const [, , count] = await multi.exec();

      const current = Number(count);
      if (current > limit) {
        const oldest = await redis.zrange(key, 0, 0, { withScores: true });
        const resetTime = oldest.length >= 2 ? Number(oldest[1]) + windowMs : now + windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
      }

      return { allowed: true, remaining: limit - current };
    } catch (err) {
      console.error("[rate-limit] Upstash Redis error — denying request:", err);
      return { allowed: false, remaining: 0, retryAfter: Math.ceil(windowMs / 1000) };
    }
  }

  // Development-only in-memory fallback
  const entry = devRateLimitMap.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    devRateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

// Periodically clean up expired entries to prevent unbounded memory growth
// This runs on every middleware invocation but only cleans every 5 minutes
let lastCleanupTime = 0;

function cleanupRateLimitMap() {
  try {
    const now = Date.now();

    if (now - lastCleanupTime < 5 * 60 * 1000) return;

    lastCleanupTime = now;

    if (devRateLimitMap.size === 0) return;

    for (const [key, entry] of devRateLimitMap.entries()) {
      if (now > entry.resetTime) {
        devRateLimitMap.delete(key);
      }
    }
  } catch {
    // Cleanup failure must never crash the middleware
  }
}

// ─── CSP ──────────────────────────────────────────────────────────────────────

function buildPageCsp() {
  const frameSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://*.google.com",
    "https://*.firebaseapp.com",
  ];

  if (FIREBASE_AUTH_DOMAIN) {
    frameSrc.push(`https://${FIREBASE_AUTH_DOMAIN}`);
  }

  const cspDirectives = [
    "default-src 'self'",
    process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com"
      : "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com https://github.com https://www.google-analytics.com https://avatars.githubusercontent.com",
    "connect-src 'self' blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.io https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://*.public.blob.vercel-storage.com https://api.emailjs.com https://api.github.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `frame-src ${Array.from(new Set(frameSrc)).join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  if (process.env.CSP_REPORT_URL) {
    cspDirectives.push(`report-uri ${process.env.CSP_REPORT_URL}`);
    cspDirectives.push(`report-to ${process.env.CSP_REPORT_URL}`);
  }

  return cspDirectives.join("; ");
}

// ─── Firebase Token Verification via jose ────────────────────────────────────
// Uses jose to verify Firebase ID tokens locally and falls back to
// identitytoolkit REST lookup when needed.

let cachedPublicKey = null;
let publicKeyFetchTime = 0;
const PUBLIC_KEY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (cachedPublicKey && now - publicKeyFetchTime < PUBLIC_KEY_CACHE_TTL_MS) {
    return cachedPublicKey;
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } } // Cache for 1 hour using Next.js Data Cache
    );

    if (!response.ok) {
      throw new Error("Failed to fetch public keys");
    }

    const data = await response.json();
    cachedPublicKey = data;
    publicKeyFetchTime = now;
    return data;
  } catch (error) {
    console.error("Failed to fetch Firebase public keys:", error);
    return cachedPublicKey || {};
  }
}

async function fetchUserRoleFromFirestore(uid, token) {
  if (!FIREBASE_PROJECT_ID || !uid || !token) return null;

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return data?.fields?.role?.stringValue || null;
  } catch {
    return null;
  }
}

/**
 * Verifies a Firebase ID token using local JWT verification via jose.
 * Falls back to the identitytoolkit REST API if local verification fails.
 */
async function verifyIdToken(token) {
  try {
    const getJwtExp = (t) => {
      try {
        const parts = t.split(".");
        if (parts.length < 2) return null;
        let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (payload.length % 4) payload += "=";
        const decoded =
          typeof atob === "function"
            ? atob(payload)
            : Buffer.from(payload, "base64").toString("utf8");
        const parsed = JSON.parse(decoded);
        return {
          exp: typeof parsed.exp === "number" ? parsed.exp : null,
          kid: parsed.kid || null,
        };
      } catch {
        return null;
      }
    };

    const jwtMeta = getJwtExp(token);
    if (jwtMeta?.exp) {
      const now = Math.floor(Date.now() / 1000);
      if (now > jwtMeta.exp + CLOCK_TOLERANCE_SECONDS) {
        return null;
      }
    }

    if (!FIREBASE_PROJECT_ID) return null;

    const publicKeys = await getFirebasePublicKeys();
    if (publicKeys && Object.keys(publicKeys).length > 0) {
      try {
        const headerParts = token.split(".");
        if (headerParts.length >= 1) {
          let headerPayload = headerParts[0]
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          while (headerPayload.length % 4) headerPayload += "=";
          const headerJson =
            typeof atob === "function"
              ? atob(headerPayload)
              : Buffer.from(headerPayload, "base64").toString("utf8");
          const header = JSON.parse(headerJson);
          const kid = header.kid;

          if (kid && publicKeys[kid]) {
            const publicKey = await jose.importSPKI(publicKeys[kid], "RS256");
            const { payload } = await jose.jwtVerify(token, publicKey, {
              issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
              audience: FIREBASE_PROJECT_ID,
              clockTolerance: CLOCK_TOLERANCE_SECONDS,
            });

            let role = payload.role || null;
            if (!role && payload.sub) {
              role = await fetchUserRoleFromFirestore(payload.sub, token);
            }

            return {
              sub: payload.sub,
              uid: payload.sub,
              email: payload.email,
              email_verified: payload.email_verified === true,
              role,
              iat: payload.iat,
            };
          }
        }
      } catch {
        // Local verification failed, fall through to REST API
      }
    }

    if (!FIREBASE_API_KEY) return null;

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json().catch(() => null);
    const user = data?.users?.[0];
    if (!user?.localId) return null;

    let parsedCustomClaims = {};
    if (user.customAttributes) {
      try {
        parsedCustomClaims = JSON.parse(user.customAttributes);
      } catch {
        parsedCustomClaims = {};
      }
    }

    const authTimeSeconds = user.lastLoginAt
      ? Math.floor(Number(user.lastLoginAt) / 1000)
      : undefined;

    return {
      sub: user.localId,
      uid: user.localId,
      email: user.email,
      email_verified: user.emailVerified === true,
      role: parsedCustomClaims?.role || null,
      iat: authTimeSeconds,
    };
  } catch {
    return null;
  }
}

// ─── RBAC enforcement ────────────────────────────────────────────────────────

function enforceApiRbac(pathname, isTokenValid, isEmailVerified, userRole) {
  const rule = getApiRouteRule(pathname);

  if (!rule) {
    // Not an API route — no RBAC enforcement
    return null;
  }

  if (rule.public) {
    return null;
  }

  if (!isTokenValid) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!isEmailVerified) {
    return { error: "Forbidden: Email not verified", status: 403 };
  }

  if (rule.roles && rule.roles.length > 0) {
    if (!userRole) {
      return { error: "Forbidden: No role assigned", status: 403 };
    }
    if (!rule.roles.includes(userRole)) {
      return { error: "Forbidden: Role mismatch", status: 403 };
    }
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }
  const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);

  // Clean up expired rate limit entries periodically
  cleanupRateLimitMap();

  // NOTE: CSRF validation applies only for cookie-authenticated requests.
  // Requests authenticated via Authorization: Bearer <token> are not CSRF-vulnerable.
  // Defer CSRF validation until after token extraction/verification below.

  if (pathname.startsWith("/api/") && isUnsafeMethod) {
    const contentLength = Number(request.headers.get("content-length"));
    if (!Number.isNaN(contentLength) && contentLength > 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large (limit 1MB)" },
        { status: 413 }
      );
    }
  }

  // ── 1. Rate limiting for auth API routes ──
  if (isAuthRoute(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, remaining, retryAfter } = await rateLimit(ip, pathname, request);

    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many attempts. Please try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  const requestHeaders = new Headers(request.headers);

  let authToken = null;
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    authToken = authorization.split(" ")[1];
  }
  if (!authToken) {
    authToken = request.cookies.get("authToken")?.value;
  }

  let isTokenValid = false;
  let isEmailVerified = false;
  let userRole = null;

  if (authToken) {
    const payload = await verifyIdToken(authToken);
    if (payload) {
      isTokenValid = true;
      isEmailVerified = !!payload.email_verified;
      userRole = payload.role || null;
    }
  }

  if (pathname.startsWith("/api/") && isUnsafeMethod) {
    if (isTokenValid && pathname.startsWith("/api/")) {
      const sessionId =
        request.cookies.get("sessionId")?.value ||
        request.headers.get("x-session-id");
      if (sessionId) {
        try {
          const redis = getRedisClient();
          if (redis) {
            const exists = await redis.exists(`session:${sessionId}`);
            if (exists !== 1) {
              return NextResponse.json(
                { error: "Session expired or terminated concurrently" },
                { status: 401 }
              );
            }
          }
        } catch {
          // Redis unavailable — continue without session validation
        }
      }
    }

    const tokenFromCookie = request.cookies.get("authToken")?.value || null;
    if (tokenFromCookie) {
      try {
        validateCsrfOriginAndReferer(request);
        validateCsrfRequest(request);
      } catch (error) {
        return NextResponse.json(
          { error: error.message || "Forbidden: invalid CSRF request" },
          { status: error.statusCode || 403 }
        );
      }
    }
  }

  const protectedDashboards = [
    {
      prefix: "/student",
      apiPrefix: "/api/student",
      role: "student",
      defaultPath: "/student/dashboard",
    },
    {
      prefix: "/teacher",
      apiPrefix: "/api/teacher",
      role: "teacher",
      defaultPath: "/teacher/dashboard",
    },
    {
      prefix: "/admin",
      apiPrefix: "/api/admin",
      role: "admin",
      defaultPath: "/admin/dashboard",
    },
    {
      prefix: "/institute",
      apiPrefix: "/api/institute",
      role: "institute",
      defaultPath: "/institute/dashboard",
    },
    {
      prefix: "/parent",
      apiPrefix: "/api/parent",
      role: "parent",
      defaultPath: "/parent/dashboard",
    },
  ];

  const matchedDashboard = protectedDashboards.find(
    (dashboard) =>
      pathname.startsWith(dashboard.prefix) ||
      (dashboard.apiPrefix && pathname.startsWith(dashboard.apiPrefix))
  );

  // ── 2. RBAC enforcement for all API routes ──
  // This runs before handler execution, enforcing the centralized policy
  // defined in API_ROUTE_RULES. Fail-closed: unmatched paths default to
  // authenticated access.
  if (pathname.startsWith("/api/") && !matchedDashboard) {
    const rbacResult = enforceApiRbac(pathname, isTokenValid, isEmailVerified, userRole);
    if (rbacResult) {
      return NextResponse.json(
        { error: rbacResult.error },
        { status: rbacResult.status }
      );
    }
  }

  if (matchedDashboard) {
    if (!isTokenValid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (!isEmailVerified) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Email not verified" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/verify", request.url));
    }
    if (userRole !== matchedDashboard.role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Role mismatch" },
          { status: 403 }
        );
      }
      const correctDashboard = protectedDashboards.find(
        (d) => d.role === userRole
      );
      const redirectTarget = correctDashboard
        ? correctDashboard.defaultPath
        : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  const generalProtectedRoutes = ["/profile", "/settings"];
  const isGeneralProtected = generalProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isGeneralProtected) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL("/verify", request.url));
    }
  }

  if (pathname.startsWith("/verify")) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (isEmailVerified) {
      const correctDashboard = protectedDashboards.find(
        (d) => d.role === userRole
      );
      const redirectTarget = correctDashboard
        ? correctDashboard.defaultPath
        : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  if (pathname === "/auth" && isTokenValid && isEmailVerified && userRole) {
    const correctDashboard = protectedDashboards.find(
      (d) => d.role === userRole
    );
    if (correctDashboard) {
      return NextResponse.redirect(
        new URL(correctDashboard.defaultPath, request.url)
      );
    }
  }

  const isPage =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|json)$/);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isPage) {
    response.headers.set("Content-Security-Policy", buildPageCsp());
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(self), microphone=(), geolocation=()"
    );
    response.headers.set("X-XSS-Protection", "1; mode=block");
  }

  return response;
}

// Exported for unit testing (in-memory fallback behavior)
export { isAuthRoute, rateLimit, cleanupRateLimitMap, devRateLimitMap, resetForTest };

// Test helper to control cleanup timer
function resetForTest(now) {
  lastCleanupTime = now;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};
