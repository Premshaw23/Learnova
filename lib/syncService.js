import {
  getPendingActions,
  updateActionStatus,
  removePendingAction,
} from "@/db/offlineStore";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// CONFLICT RESOLUTION ENGINE (Version Vectoring / Last-Write-Wins)
// ---------------------------------------------------------------------------

/**
 * Smart Conflict Resolver using Last-Write-Wins (LWW).
 * Compares the local offline record against the remote database record.
 * * @param {Object} localRecord - The record saved while offline.
 * @param {Object} remoteRecord - The current truth from the database.
 * @returns {Object} The safely merged record ready for syncing.
 */
export function resolveConflict(localRecord, remoteRecord) {
  if (!remoteRecord) return localRecord; // No conflict, remote doesn't exist

  // Normalize timestamps to epochs for accurate mathematical comparison
  const getEpoch = (record) => {
    const timeVal = record.timestamp || record.updatedAt || 0;
    return new Date(timeVal).getTime();
  };

  const localTime = getEpoch(localRecord);
  const remoteTime = getEpoch(remoteRecord);

  // If local is strictly newer, local wins. Otherwise, remote wins to prevent stale overwrites.
  if (localTime > remoteTime) {
    logger.warn(`[Sync] Conflict detected for ${localRecord.id}: Local is newer. Overwriting remote.`);
    // Deep merge: Keep remote metadata, overwrite with local data
    return { ...remoteRecord, ...localRecord, updatedAt: new Date().toISOString() };
  } else {
    logger.warn(`[Sync] Conflict detected for ${localRecord.id}: Remote is newer. Discarding stale local cache.`);
    return remoteRecord; 
  }
}

// ---------------------------------------------------------------------------
// NETWORK & RETRY UTILITIES
// ---------------------------------------------------------------------------

/**
 * Wrapper for fetch with basic timeout and exponential backoff retry logic.
 */
async function fetchWithRetry(url, options = {}, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return response;
    } catch (err) {
      if (i === retries) throw err;
      // Wait before retrying (Exponential backoff: 500ms, 1000ms)
      await new Promise(res => setTimeout(res, 500 * Math.pow(2, i)));
    }
  }
}

// ---------------------------------------------------------------------------
// CORE SYNC LOGIC
// ---------------------------------------------------------------------------

/**
 * Syncs a single record by fetching the remote version, 
 * resolving conflicts, and pushing the result safely.
 */
export async function syncSingleRecord(record, token) {
  try {
    // 1. Fetch remote record to verify state
    let remoteRecord = null;
    try {
      const response = await fetchWithRetry(`/api/attendance/get-record?id=${record.id}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      remoteRecord = await response.json();
    } catch (fetchErr) {
      logger.info(`[Sync] No remote record found or fetch failed for ${record.id}. Proceeding with local.`);
    }

    // 2. Resolve conflicts
    const resolvedRecord = resolveConflict(record, remoteRecord);

    // If the conflict resolver determined the remote is newer, we don't need to push the stale local data
    if (remoteRecord && resolvedRecord === remoteRecord) {
      logger.info(`[Sync] Record ${record.id} is stale. Skipping push.`);
      return true; // Return true so it gets removed from the local outbox
    }

    // 3. Push the resolved record to the server
    const syncRes = await fetchWithRetry("/api/attendance/sync-single", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ record: resolvedRecord }),
    });

    return true;
  } catch (err) {
    logger.error(`[Sync] Failed to sync record ${record.id}:`, { err });
    return false; // Return false so it stays in the IndexedDB outbox to try again later
  }
}

/**
 * Flushes the attendance IndexedDB outbox to the server.
 */
export async function syncAttendanceQueue() {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;
  const records = await getOutboxRecords();
  if (records.length === 0) return;

  try {
    const auth = getAuth();
    let tokenStr = "";
    if (auth && auth.currentUser) {
      tokenStr = await auth.currentUser.getIdToken();
    } else {
      logger.warn("[Sync] User not authenticated. Delaying sync.");
      return;
    }

    logger.info(`[Sync] Attempting to sync ${records.length} queued records...`);

    // Process all records concurrently
    const results = await Promise.all(
      records.map(record => syncSingleRecord(record, tokenStr))
    );

    // Clean up successfully synced records
    let syncedCount = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i]) {
        await removeFromOutbox(records[i].id);
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      logger.info(`[Sync] Successfully synced ${syncedCount} records.`);
      window.dispatchEvent(new CustomEvent("attendance-sync-complete", { 
        detail: { count: syncedCount } 
      }));
    }
    
  } catch (error) {
    logger.error("[Sync] Fatal error during attendance sync queue processing:", { error });
  }
}

/**
 * Registers background sync for PWA environments.
 */
export async function registerBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-attendance");
      logger.info("[Sync] Background sync registered.");
    } catch (error) {
      logger.warn("[Sync] Background sync rejected, falling back to manual flush:", { error });
      syncAttendanceQueue();
    }
  } else {
    syncAttendanceQueue();
  }
}

// Global listener for automatic sync upon reconnection
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    logger.info("[Sync] Network restored. Triggering offline queue sync...");
    syncAttendanceQueue();
  });
}
