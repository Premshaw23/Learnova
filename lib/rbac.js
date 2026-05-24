import { authenticateRequest } from "./error-handler";
import { getUserProfile } from "./firebase-admin";
import { ForbiddenError } from "./errors";

/**
 * Requires the request to have a valid Firebase auth token.
 * Extends `authenticateRequest` by ensuring it's robust and returns the token payload.
 * 
 * @param {Request} request 
 * @returns {Promise<Object>} Decoded Firebase ID token payload
 * @throws {UnauthorizedError} if token is missing or invalid
 */
export async function requireAuth(request) {
  // authenticateRequest handles token verification and throws UnauthorizedError if invalid
  const decodedToken = await authenticateRequest(request);
  return decodedToken;
}

/**
 * Ensures the authenticated user has a role that matches one of the allowed roles.
 * Fetches the user profile from Firestore to securely determine the role.
 * 
 * @param {Request} request 
 * @param {string[]} allowedRoles Array of allowed roles (e.g., ["admin", "teacher"])
 * @returns {Promise<{ payload: Object, profile: Object }>}
 * @throws {UnauthorizedError} if token is invalid
 * @throws {ForbiddenError} if the user's role is not in the allowed list or profile is missing
 */
export async function requireRole(request, allowedRoles) {
  const payload = await requireAuth(request);
  const uid = payload.uid;

  const profile = await getUserProfile(uid);

  if (!profile) {
    throw new ForbiddenError("User profile not found. Access denied.");
  }

  const userRole = profile.role;

  if (!allowedRoles.includes(userRole)) {
    throw new ForbiddenError(`Forbidden: Requires one of ${allowedRoles.join(", ")}`);
  }

  return { payload, profile };
}

/**
 * Helper to require Admin role.
 */
export async function requireAdmin(request) {
  return requireRole(request, ["admin"]);
}

/**
 * Helper to require Teacher role.
 */
export async function requireTeacher(request) {
  return requireRole(request, ["teacher"]);
}

/**
 * Helper to require Student role.
 */
export async function requireStudent(request) {
  return requireRole(request, ["student"]);
}
