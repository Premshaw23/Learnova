import { getOutboxRecords, removeFromOutbox } from "./offlineStore";
import { getAuth } from "firebase/auth";
import {
  getQueuedMutations,
  removeQueuedMutation,
  updateMutationStatus,
  incrementRetryCount,
} from "./offlineQueue";

/**
 * Attempts to flush the attendance outbox to the server.
 * This can be called by the frontend (online event listener) or the Service Worker.
 */
export async function syncAttendanceQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const records = await getOutboxRecords();

  if (records.length === 0) {
    await syncMutationQueue();
    return;
  }

  try {
    const auth = getAuth();
    // Use currentUser's token if available in the foreground context.
    // If not, our backend will rely on the `authToken` cookie which is automatically sent.
    let tokenStr = "";
    if (auth && auth.currentUser) {
      tokenStr = await auth.currentUser.getIdToken();
    }

    const response = await fetch("/api/attendance/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tokenStr ? { "Authorization": `Bearer ${tokenStr}` } : {})
      },
      body: JSON.stringify({ records }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        if (data.syncedIds?.length) {
          for (const id of data.syncedIds) {
            await removeFromOutbox(id);
          }
          window.dispatchEvent(new CustomEvent("attendance-sync-complete", { detail: { count: data.syncedIds.length } }));
        }
        if (data.rejectedIds?.length) {
          for (const id of data.rejectedIds) {
            await removeFromOutbox(id);
          }
          window.dispatchEvent(new CustomEvent("attendance-sync-rejected", { detail: { count: data.rejectedIds.length, warning: data.warning } }));
        }
      }
    } else {
      console.error("Attendance sync failed with status:", response.status);
    }
  } catch (error) {
    console.error("Error during attendance sync:", error);
  }

  await syncMutationQueue();
}

/**
 * Registers background sync if supported by the browser.
 */
export async function registerBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-attendance");
    } catch (error) {
      console.warn("Background sync could not be registered:", error);
      // Fallback: manually attempt sync now just in case
      syncAttendanceQueue();
    }
  } else {
    // Fallback if Background Sync API is unsupported (like Safari)
    syncAttendanceQueue();
  }
}

/**
 * Sync queued API mutations
 */
export async function syncMutationQueue() {
  const mutations = await getQueuedMutations();

  if (!mutations.length) return;

  let successCount = 0;
  let failCount = 0;

  for (const mutation of mutations) {
    try {
      await updateMutationStatus(mutation.id, "syncing");

      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers || {},
        body: mutation.body
          ? JSON.stringify(mutation.body)
          : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      await removeQueuedMutation(mutation.id);

      successCount++;
    } catch (error) {
      console.error("Mutation replay failed:", error);

      await incrementRetryCount(mutation.id);

      await updateMutationStatus(
        mutation.id,
        "pending"
      );

      failCount++;
    }
  }

  navigator.serviceWorker?.controller?.postMessage({
    type: "MUTATIONS_SYNC_COMPLETE",
    successCount,
    failCount,
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncAttendanceQueue();
  });
}

