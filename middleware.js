import { NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

const AUTH_RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-otp",
];

function isAuthRoute(pathname) {
  return AUTH_RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
}

function rateLimit(ip, pathname) {
  const key = `${ip}_${pathname}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
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

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com https://github.com https://www.google-analytics.com",
    "connect-src 'self' blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.io https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://*.public.blob.vercel-storage.com https://api.emailjs.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `frame-src ${Array.from(new Set(frameSrc)).join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

// ─── Firebase Token Verification ─────────────────────────────────────────────

async function verifyIdToken(token) {
  try {
    if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) return null;

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
      role: parsedCustomClaims?.role,
      iat: authTimeSeconds,
    };
  } catch {
    return null;
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // ── 1. Rate limiting for auth API routes ──
  if (isAuthRoute(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const { allowed, remaining, retryAfter } = rateLimit(ip, pathname);

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

  // ── 2. CSP: only for HTML pages, not assets or APIs ──
  const isPage =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|json)$/);

  const requestHeaders = new Headers(request.headers);

  // ── 3. Token extraction ──
  let authToken = null;
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    authToken = authorization.split(" ")[1];
  }
  if (!authToken) {
    authToken = request.cookies.get("authToken")?.value;
  }

  // ── 4. Token verification ──
  let isTokenValid = false;
  let isEmailVerified = false;
  let userRole = null;

  if (authToken) {
    const payload = await verifyIdToken(authToken);
    if (payload) {
      isTokenValid = true;
      isEmailVerified = !!payload.email_verified;

      if (payload.role) {
        userRole = payload.role;
      } else if (FIREBASE_PROJECT_ID) {
        try {
          const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${payload.sub}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          if (res.ok) {
            const data = await res.json();
            userRole = data.fields?.role?.stringValue || null;
          }
        } catch (err) {
          console.error("Middleware Edge fetch failed:", err);
        }
      }
    }
  }

  // ── 5. Role-protected dashboard routes ──
  const protectedDashboards = [
    { prefix: "/student", apiPrefix: "/api/student", role: "student", defaultPath: "/student/dashboard" },
    { prefix: "/teacher", apiPrefix: "/api/teacher", role: "teacher", defaultPath: "/teacher/dashboard" },
    { prefix: "/admin", apiPrefix: "/api/admin", role: "admin", defaultPath: "/admin/dashboard" },
    { prefix: "/institute", apiPrefix: "/api/institute", role: "institute", defaultPath: "/institute/dashboard" },
  ];

  const matchedDashboard = protectedDashboards.find((dashboard) =>
    pathname.startsWith(dashboard.prefix) ||
    (dashboard.apiPrefix && pathname.startsWith(dashboard.apiPrefix))
  );

  // General API route protection (non-dashboard routes under /api/)
  if (pathname.startsWith("/api/") && pathname !== "/api/check-groq-config") {
    if (!matchedDashboard) {
      if (!isTokenValid) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!isEmailVerified) {
        return NextResponse.json({ error: "Forbidden: Email not verified" }, { status: 403 });
      }
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
        return NextResponse.json({ error: "Forbidden: Email not verified" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/verify", request.url));
    }
    if (userRole !== matchedDashboard.role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Role mismatch" }, { status: 403 });
      }
      const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
      const redirectTarget = correctDashboard ? correctDashboard.defaultPath : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  // ── 6. General protected routes ──
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

  // ── 7. Email verification page ──
  if (pathname.startsWith("/verify")) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (isEmailVerified) {
      const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
      const redirectTarget = correctDashboard ? correctDashboard.defaultPath : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  // ── 8. Redirect logged-in users away from /auth ──
  if (pathname === "/auth" && isTokenValid && isEmailVerified && userRole) {
    const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
    if (correctDashboard) {
      return NextResponse.redirect(new URL(correctDashboard.defaultPath, request.url));
    }
  }

  // ── 9. Attach CSP header for pages ──
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isPage) {
    response.headers.set("Content-Security-Policy", buildPageCsp());
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};