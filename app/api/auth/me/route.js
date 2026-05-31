import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAuth } from "@/lib/rbac";
import { getUserProfile } from "@/lib/firebase-admin";
import { checkRateLimit } from "@/lib/rateLimit";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 *
 * Lightweight endpoint that returns the current user's role from Firestore.
 * Used by the client to detect role changes that haven't propagated to JWT
 * custom claims yet. When the role from Firestore differs from the JWT role,
 * the client forces a token refresh to get updated claims.
 *
 * This resolves the middleware/API role desynchronization issue where
 * custom claims can be stale for up to 1 hour after a role change.
 */
export const GET = withErrorHandler(async (request) => {
  const decodedToken = await requireAuth(request);
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
  const rateLimitResult = await checkRateLimit(`auth_me_${ip}_${decodedToken.uid}`);
  if (!rateLimitResult.allowed) {
    throw new AppError("Too many requests. Please slow down.", 429);
  }

  const profile = await getUserProfile(decodedToken.uid);

  return NextResponse.json({
    uid: decodedToken.uid,
    email: decodedToken.email,
    emailVerified: decodedToken.email_verified,
    // Return the authoritative role from Firestore
    role: profile?.role || null,
    // Return the JWT role for comparison on the client side
    jwtRole: decodedToken.role || null,
    // Indicate whether the roles are in sync
    rolesInSync: (profile?.role || null) === (decodedToken.role || null),
  });
});
