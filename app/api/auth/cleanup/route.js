import { jsonSuccess, jsonError } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest, parseJSON } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side cleanup endpoint for orphaned Firebase Auth accounts.
 * This endpoint uses the Firebase Admin SDK to delete auth accounts
 * that cannot be deleted client-side due to re-authentication requirements.
 * 
 * Called when client-side profile creation fails and the auth account
 * needs to be cleaned up. Access is strictly authenticated to ensure a user
 * can only delete their own freshly created/orphaned account (CWE-306).
 */
export const POST = withErrorHandler(async (request) => {
  // 1. Authenticate request via Firebase token first to prevent unauthenticated/arbitrary deletion
  const decodedToken = await authenticateRequest(request);

  // 2. Parse request body securely with maxBytes limitation (1KB) to prevent DoS
  const body = await parseJSON(request, 1024);
  const { uid } = body;

  if (!uid || typeof uid !== "string") {
    return jsonError("Invalid or missing UID parameter", 400);
  }

  // 3. Ensure the authenticated user can only delete/cleanup their own account!
  if (decodedToken.uid !== uid) {
    return jsonError("Forbidden: Cannot clean up other users' accounts", 403);
  }

  try {
    initializeFirebase();
    
    logger.info(`[auth-cleanup] Attempting to delete orphaned account: ${uid}`);
    
    // Delete the user from Firebase Auth using Admin SDK
    // This bypasses the re-authentication requirement
    await admin.auth().deleteUser(uid);
    
    logger.info(`[auth-cleanup] Successfully deleted orphaned account: ${uid}`);
    
    return jsonSuccess({ 
      message: "Orphaned auth account deleted successfully",
      uid 
    });
  } catch (error) {
    // Don't throw if user doesn't exist - they may have been already cleaned up
    if (error.code === "auth/user-not-found") {
      logger.warn(`[auth-cleanup] User ${uid} not found - may have been already cleaned up`);
      return jsonSuccess({ 
        message: "User already deleted or not found",
        uid 
      });
    }

    logger.error(`[auth-cleanup] Failed to delete orphaned account ${uid}: ${error.message}`);
    
    // Log for manual cleanup but don't expose internal error details
    return jsonError("Failed to cleanup orphaned account. Please contact support.", 500);
  }
});
