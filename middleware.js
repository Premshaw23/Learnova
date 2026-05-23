import { NextResponse } from "next/server";

// Firebase publishes RS256 public keys here; rotate every ~6 hours
const JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// In-process key cache — shared across requests within the same Edge worker instance
let _cachedKeys = null;
let _cacheExpiry = 0;

/**
 * Fetches and caches Firebase RS256 public keys from the JWKS endpoint.
 * Respects the Cache-Control max-age header Firebase provides (~6 h).
 * Throws on network failure — callers must handle and fail closed.
 * @returns {Promise<Record<string, CryptoKey>>} Map of kid → CryptoKey
 */
async function fetchPublicKeys() {
  const now = Date.now();
  
  // L1 Cache: Fast in-memory return if the current Edge isolate is still alive
  if (_cachedKeys && now < _cacheExpiry) return _cachedKeys;

  // L2 Cache: Next.js Data Cache to prevent 429 Rate Limit errors across new Edge isolates
  const res = await fetch(JWKS_URL, {
    cache: "force-cache",
    next: { revalidate: 21600 } // Cache response at the edge for 6 hours (21600 seconds)
  });
  
  if (!res.ok) {
    throw new Error(`JWKS fetch failed: ${res.status}`);
  }

  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSec = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

  const { keys } = await res.json();
  const imported = {};

  for (const jwk of keys) {
    imported[jwk.kid] = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  }

  _cachedKeys = imported;
  _cacheExpiry = now + maxAgeSec * 1000;
  return imported;
}

/**
 * Decodes a base64url-encoded string into a Uint8Array.
 * @param {string} str - Base64url input
 * @returns {Uint8Array}
 */
function base64UrlDecode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded + "=".repeat((4 - (padded.length % 4)) % 4);
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
}

/**
 * Verifies a Firebase ID token's RS256 signature and all standard claims.
 * Runs entirely in the Edge Runtime using the Web Crypto API — no Node.js
 * dependencies required. Fails closed: any error returns null (deny access).
 *
 * @param {string} token - The Firebase ID token from the authToken cookie
 * @returns {Promise<Object|null>} Verified payload, or null if invalid
 */
async function verifyIdToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(parts[0]))
    );
    if (header.alg !== "RS256") return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(parts[1]))
    );

    const now = Math.floor(Date.now() / 1000);

    // Validate standard JWT claims as required by the Firebase ID token spec:
    // https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
    if (
      !payload.sub ||
      payload.aud !== FIREBASE_PROJECT_ID ||
      payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}` ||
      payload.exp <= now ||
      payload.iat > now + 300 // tolerate up to 5-minute clock skew
    ) {
      return null;
    }

    // Fetch cached RS256 public keys and locate the one matching this token
    const publicKeys = await fetchPublicKeys();
    const publicKey = publicKeys[header.kid];
    if (!publicKey) return null; // unknown key ID — reject (handles alg:none, HS256, etc.)

    // Cryptographically verify the signature over header.payload
    const signingInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature,
      signingInput
    );

    return valid ? payload : null;
  } catch {
    // Network errors, malformed JSON, or crypto failures all result in denial
    return null;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

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
              headers: { Authorization: `Bearer ${authToken}` },
              cache: "force-cache",
              next: { revalidate: 300 } // Cache securely at the edge for 5 minutes
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

  return NextResponse.next();
}

// Next.js Middleware matcher configuration
export const config = {
  matcher: [
    "/student/:path*",
    "/teacher/:path*",
    "/admin/:path*",
    "/institute/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/verify/:path*",
    "/auth",
  ],
};