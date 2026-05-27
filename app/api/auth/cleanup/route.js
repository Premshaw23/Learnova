import { jsonSuccess, jsonError } from "@/lib/api-response";
import { withErrorHandler } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Server-side cleanup endpoint for orphaned Firebase Auth accounts.
 * This endpoint uses the Firebase Admin SDK to delete auth accounts
 * that cannot be deleted client-side due to re-authentication requirements.
 * 
 * Called when client-side profile creation fails and the auth account
 * needs to be cleaned up to prevent orphaned accounts.
 */
export const POST = withErrorHandler(async (request) => {
  const body = await request.json();
  const { uid } = body;

  if (!uid || typeof uid !== "string") {
    return jsonError("Invalid or missing UID parameter", 400);
  }

  try {
    initializeFirebase();
    
    console.log(`[auth-cleanup] Attempting to delete orphaned account: ${uid}`);
    
    // Delete the user from Firebase Auth using Admin SDK
    // This bypasses the re-authentication requirement
    await admin.auth().deleteUser(uid);
    
    console.log(`[auth-cleanup] Successfully deleted orphaned account: ${uid}`);
    
    return jsonSuccess({ 
      message: "Orphaned auth account deleted successfully",
      uid 
    });
  } catch (error) {
    // Don't throw if user doesn't exist - they may have been already cleaned up
    if (error.code === "auth/user-not-found") {
      console.warn(`[auth-cleanup] User ${uid} not found - may have been already cleaned up`);
      return jsonSuccess({ 
        message: "User already deleted or not found",
        uid 
      });
    }

    console.error(`[auth-cleanup] Failed to delete orphaned account ${uid}:`, error.message);
    
    // Log for manual cleanup but don't expose internal error details
    return jsonError("Failed to cleanup orphaned account. Please contact support.", 500);
  }
});
