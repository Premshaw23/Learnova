import { authenticateRequest } from "@/lib/error-handler";
import { getUserProfile } from "@/lib/firebase-admin";
import { ForbiddenError } from "@/lib/errors";

export const PUBLIC_API_PATHS = new Set([
  "/api/auth/csrf",
  "/api/auth/reset-password",
  "/api/health",
]);

const API_ROUTE_RULES = [
  { pattern: /^\/api\/student(?:\/|$)/, roles: ["student", "admin"] },
  { pattern: /^\/api\/teacher(?:\/|$)/, roles: ["teacher", "admin"] },
  { pattern: /^\/api\/admin(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/api\/institute(?:\/|$)/, roles: ["institute", "admin"] },
  { pattern: /^\/api\/parent(?:\/|$)/, roles: ["parent", "admin"] },
  {
    pattern: /^\/api\/analytics\/attendance-risk(?:\/|$)/,
    roles: ["teacher", "institute", "admin"],
  },
  {
    pattern: /^\/api\/attendance\/settings(?:\/|$)/,
    roles: ["teacher", "admin"],
  },
  { pattern: /^\/api\/attendance\/record(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/sync(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/validate-passcode(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/attendance\/heatmap(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/activities(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/cleanup(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/me(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/session(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/auth\/set-role(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/check-groq-config(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/complaints(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/conversations(?:\/|$)/, authOnly: true },
  {
    pattern: /^\/api\/flashcards(?:\/|$)/,
    roles: ["student", "teacher", "admin"],
  },
  { pattern: /^\/api\/groq(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/images(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/labels(?:\/|$)/, roles: ["admin", "teacher", "student"] },
  { pattern: /^\/api\/notifications(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/notifications\/seed(?:\/|$)/, roles: ["admin"] },
  { pattern: /^\/api\/notices(?:\/|$)/, roles: ["teacher", "admin", "staff"] },
  {
    pattern: /^\/api\/productivity(?:\/|$)/,
    roles: ["student", "teacher", "admin"],
  },
  { pattern: /^\/api\/settings(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/stats(?:\/|$)/, authOnly: true },
  { pattern: /^\/api\/upload\/avatar(?:\/|$)/, authOnly: true },
];

function normalizeRoles(allowedRoles) {
  if (!allowedRoles) return [];
  return Array.isArray(allowedRoles)
    ? allowedRoles.filter(Boolean)
    : [allowedRoles];
}

function isEmailVerified(payload) {
  return payload?.email_verified === true || payload?.emailVerified === true;
}

function getApiRouteRule(pathname) {
  if (!pathname || !pathname.startsWith("/api/")) {
    return null;
  }

  if (PUBLIC_API_PATHS.has(pathname)) {
    return { public: true };
  }

  return (
    API_ROUTE_RULES.find((rule) => rule.pattern.test(pathname)) || {
      authOnly: true,
    }
  );
}

/**
 * Requires the request to have a valid Firebase auth token.
 * Email verification is enforced by default.
 *
 * @param {Request} request
 * @param {{ emailVerifiedRequired?: boolean }} options
 * @returns {Promise<Object>} Decoded Firebase ID token payload
 * @throws {UnauthorizedError} if token is missing or invalid
 * @throws {ForbiddenError} if the email is not verified and verification is required
 */
export async function requireAuth(request, options = {}) {
  const payload = await authenticateRequest(request);
  const { emailVerifiedRequired = true } = options;

  if (emailVerifiedRequired && !isEmailVerified(payload)) {
    throw new ForbiddenError("Forbidden: Email not verified");
  }

  return payload;
}

/**
 * Ensures the authenticated user has a role that matches one of the allowed roles.
 * Uses JWT custom claims as the source of truth for authorization and returns
 * the Firestore profile for callers that need to inspect it.
 *
 * @param {Request} request
 * @param {string[]} allowedRoles Array of allowed roles (e.g., ["admin", "teacher"])
 * @param {{ emailVerifiedRequired?: boolean }} options
 * @returns {Promise<{ payload: Object, profile: Object|null }>}
 * @throws {UnauthorizedError} if token is invalid
 * @throws {ForbiddenError} if the email is unverified or the user's role is not in the allowed list
 */
export async function requireRole(request, allowedRoles, options = {}) {
  const payload = await requireAuth(request, options);
  const userRole = payload.role;

  if (!userRole) {
    throw new ForbiddenError(
      "User role not found in token claims. Access denied."
    );
  }

  const normalizedRoles = normalizeRoles(allowedRoles);

  if (!normalizedRoles.includes(userRole)) {
    throw new ForbiddenError(
      `Forbidden: Requires one of ${normalizedRoles.join(", ")}`
    );
  }

  return { payload, profile: await getUserProfile(payload.uid) };
}

/**
 * Route-aware authorization helper that applies centralized API metadata.
 * Public routes are returned as public, role-gated routes enforce their role
 * list, and every other API route defaults to auth-only access.
 *
 * @param {Request} request
 * @param {{ allowedRoles?: string[]|string, emailVerifiedRequired?: boolean }} options
 * @returns {Promise<{ payload?: Object, profile?: Object|null, public?: true }>}
 */
export async function requireApiAccess(request, options = {}) {
  const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
  const rule = getApiRouteRule(pathname);

  if (rule?.public) {
    return { public: true };
  }

  const emailVerifiedRequired = options.emailVerifiedRequired ?? true;
  const allowedRoles = normalizeRoles(options.allowedRoles || rule?.roles);

  if (allowedRoles.length > 0) {
    return requireRole(request, allowedRoles, { emailVerifiedRequired });
  }

  const payload = await requireAuth(request, { emailVerifiedRequired });
  return { payload, profile: await getUserProfile(payload.uid) };
}

/**
 * Helper to require Admin role.
 */
export async function requireAdmin(request, options = {}) {
  return requireRole(request, ["admin"], options);
}

/**
 * Helper to require Teacher role.
 */
export async function requireTeacher(request, options = {}) {
  return requireRole(request, ["teacher"], options);
}

/**
 * Helper to require Student role.
 */
export async function requireStudent(request, options = {}) {
  return requireRole(request, ["student"], options);
}

/**
 * Helper to require Parent role.
 */
export async function requireParent(request, options = {}) {
  return requireRole(request, ["parent"], options);
}
