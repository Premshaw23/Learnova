/**
 * ============================================================================
 * 🔌 OFFLINE REQUEST HANDLER (Refactored for Issue #4224)
 * ============================================================================
 * Refactored to use the unified offline storage layer.
 * Handles queuing of offline mutations with:
 *   - Automatic type detection
 *   - Priority assignment
 *   - Background sync registration
 *   - UI event notifications
 */

import {
  upsertRecord,
  RECORD_TYPES,
} from "@/lib/offlineStorage";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENDPOINT_TYPE_MAP = [
  { pattern: "/attendance", type: RECORD_TYPES.ATTENDANCE },
  { pattern: "/complaints", type: RECORD_TYPES.COMPLAINT },
  { pattern: "/quiz", type: RECORD_TYPES.QUIZ },
  { pattern: "/activity", type: RECORD_TYPES.ACTIVITY },
];

// ---------------------------------------------------------------------------
// Request Handler
// ---------------------------------------------------------------------------

/**
 * Handle a request that failed due to being offline.
 * Queues the mutation for later sync.
 *
 * @param {string} endpoint - The API endpoint
 * @param {Object} options  - Fetch options (method, headers, body)
 * @returns {Response} A mock 202 Accepted response
 */
export async function handleOfflineRequest(endpoint, options = {}) {
  const method = (options.method || "GET").toUpperCase();

  // Only queue mutations
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    throw new Error("Network error");
  }

  // Detect action type from endpoint
  const actionType = detectActionType(endpoint);

  // Parse body if it's a string
  let payload = options.body;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      // Keep as string if not valid JSON
    }
  }

  // Create unified record
  const record = await upsertRecord({
    type: actionType,
    collection: endpoint.split("/").filter(Boolean).pop() || "general",
    data: {
      endpoint,
      method,
      headers: options.headers,
      payload,
    },
    vectorClock: { [payload?.userId || "offline"]: 1 },
  });

  logger.info(`[OfflineRequest] Queued ${actionType} mutation: ${record.id}`);

  // Attempt to register background sync
  if (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    "SyncManager" in window
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-pending-actions");
    } catch (err) {
      logger.warn("Background sync registration failed:", err);
    }
  }

  // Notify UI
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("learnova:offline-action-queued", {
        detail: {
          type: actionType,
          endpoint,
          recordId: record.id,
        },
      })
    );
  }

  // Return a mock successful response
  return new Response(
    JSON.stringify({
      success: true,
      queuedOffline: true,
      recordId: record.id,
      message:
        "Action saved locally. It will be synchronized when you are back online.",
    }),
    {
      status: 202, // Accepted
      headers: { "Content-Type": "application/json" },
    }
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Detect the action type from an API endpoint.
 */
function detectActionType(endpoint) {
  const lowerEndpoint = endpoint.toLowerCase();

  for (const { pattern, type } of ENDPOINT_TYPE_MAP) {
    if (lowerEndpoint.includes(pattern)) {
      return type;
    }
  }

  return RECORD_TYPES.GENERAL;
}

/**
 * Trigger manual sync of pending actions.
 */
export function triggerOfflineSync() {
  if (
    typeof navigator !== "undefined" &&
    navigator.serviceWorker &&
    navigator.serviceWorker.controller
  ) {
    navigator.serviceWorker.controller.postMessage({
      type: "TRIGGER_SYNC_PENDING_ACTIONS",
    });
  }
}

/**
 * Get queue status for UI display.
 */
export async function getOfflineQueueStatus() {
  try {
    const { queryRecords, SYNC_STATUS } = await import("@/lib/offlineStorage");
    const all = await queryRecords({});

    return {
      total: all.length,
      pending: all.filter((r) => r.status === SYNC_STATUS.PENDING).length,
      synced: all.filter((r) => r.status === SYNC_STATUS.SYNCED).length,
      conflict: all.filter((r) => r.status === SYNC_STATUS.CONFLICT).length,
      failed: all.filter((r) => r.status === SYNC_STATUS.FAILED).length,
    };
  } catch (error) {
    logger.error("[OfflineRequest] Failed to get queue status:", error);
    return { total: 0, pending: 0, synced: 0, conflict: 0, failed: 0 };
  }
}

export default {
  handleOfflineRequest,
  triggerOfflineSync,
  getOfflineQueueStatus,
};
