import { NextResponse } from "next/server";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

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

/**
 * Verifies a Firebase ID token by delegating validation to Firebase Auth REST API.
 * Fails closed: any error returns null (deny access).
 *
 * @param {string} token - The Firebase ID token from the authToken cookie
 * @returns {Promise<Object|null>} Verified payload, or null if invalid
 */
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

    if (!response.ok) {
      return null;
    }

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

    const payload = {
      sub: user.localId,
      uid: user.localId,
      email: user.email,
      email_verified: user.emailVerified === true,
      role: parsedCustomClaims?.role,
      iat: authTimeSeconds,
    };

    return payload;
  } catch {
    // Network errors, malformed JSON, or upstream failures all result in denial
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // We only want to generate CSP for HTML pages, not static assets or APIs.
  const isPage = !pathname.startsWith("/_next") && 
                 !pathname.startsWith("/api") && 
                 !pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|json)$/);

  const requestHeaders = new Headers(request.headers);

  // Retrieve token from Authorization header or cookies
  let authToken = null;
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    authToken = authorization.split(" ")[1];
  }
  if (!authToken) {
    authToken = request.cookies.get("authToken")?.value;
  }
  
  // Cryptographically verify the token — decoding alone is not sufficient
  let isTokenValid = false;
  let isEmailVerified = false;
  let userRole = null;

  if (authToken) {
    const payload = await verifyIdToken(authToken);
    if (payload) {
      isTokenValid = true;
      isEmailVerified = !!payload.email_verified;
      
      // Prioritize securely signed custom claim
      if (payload.role) {
        userRole = payload.role;
      } else if (FIREBASE_PROJECT_ID) {
        // Fallback: securely fetch the user's role from Firestore REST API
        try {
          const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${payload.sub}`,
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
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

  // Define role-protected dashboard routes
  const protectedDashboards = [
    { prefix: "/student", role: "student", defaultPath: "/student/dashboard" },
    { prefix: "/teacher", role: "teacher", defaultPath: "/teacher/dashboard" },
    { prefix: "/admin", role: "admin", defaultPath: "/admin/dashboard" },
    { prefix: "/institute", role: "institute", defaultPath: "/institute/dashboard" },
  ];

  // 1. If path is a protected dashboard route
  const matchedDashboard = protectedDashboards.find((dashboard) =>
    pathname.startsWith(dashboard.prefix)
  );

  if (matchedDashboard) {
    // Not logged in or invalid token -> redirect to /auth
    if (!isTokenValid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth", request.url));
    }

    // Email not verified -> redirect to /verify
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL("/verify", request.url));
    }

    // Role mismatch -> redirect to their appropriate dashboard or profile
    if (userRole !== matchedDashboard.role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden: Role mismatch" }, { status: 403 });
      }
      const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
      const redirectTarget = correctDashboard ? correctDashboard.defaultPath : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  // 2. General user protected routes (/profile, /settings)
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

  // 3. Email verification page check
  if (pathname.startsWith("/verify")) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    // If email is already verified, send them to /profile or dashboard
    if (isEmailVerified) {
      const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
      const redirectTarget = correctDashboard ? correctDashboard.defaultPath : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  // 4. Authenticated users visiting /auth -> redirect to their dashboard
  if (pathname === "/auth" && isTokenValid && isEmailVerified && userRole) {
    const correctDashboard = protectedDashboards.find((d) => d.role === userRole);
    if (correctDashboard) {
      return NextResponse.redirect(new URL(correctDashboard.defaultPath, request.url));
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isPage) {
    response.headers.set("Content-Security-Policy", buildPageCsp());
  }

  return response;
}

// Next.js Middleware matcher configuration
export const config = {
  matcher: [
    // Match all HTML page routes. Exclude APIs, static assets, favicon, manifest, and service worker.
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};
