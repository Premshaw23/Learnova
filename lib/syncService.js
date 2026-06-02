<<<<<<< HEAD
import { getOutboxRecords, removeFromOutbox } from "./offlineStore";
import { getAuth } from "firebase/auth";

import {
  getQueuedMutations,
  removeQueuedMutation,
  updateMutationStatus,
  incrementRetryCount,
} from "./offlineQueue";

import { ensureClientCsrfToken, getClientCsrfToken } from "./csrf";
=======
import { getPendingActions, updateActionStatus, removePendingAction } from "@/db/offlineStore";
>>>>>>> upstream/master

export async function syncAttendanceQueue() {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;

<<<<<<< HEAD
  const records = await getOutboxRecords();

  if (records.length === 0) {
    await syncMutationQueue();
    return;
  }

  try {
    const auth = getAuth();
    let tokenStr = "";
    if (auth && auth.currentUser) {
      tokenStr = await auth.currentUser.getIdToken();
    }

    await ensureClientCsrfToken();

    const buildHeaders = () => {
      const headers = {
        "Content-Type": "application/json",
        ...(tokenStr ? { "Authorization": `Bearer ${tokenStr}` } : {}),
      };
      const csrfToken = getClientCsrfToken();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
      return headers;
    };

    let response = await fetch("/api/attendance/sync", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify({ records }),
    });

    if (response.status === 403) {
      await ensureClientCsrfToken();
      response = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify({ records }),
      });
    }

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
      window.dispatchEvent(new CustomEvent("attendance-sync-failed", { detail: { status: response.status } }));
    }
  } catch (error) {
    console.error("Error during attendance sync:", error);
    window.dispatchEvent(new CustomEvent("attendance-sync-failed", { detail: { error: error.message } }));
  }

  await syncMutationQueue();
}

/**
 * Registers background sync if supported by the browser.
 */
export async function registerBackgroundSync() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator && "SyncManager" in window) {
=======
  const pending = await getPendingActions();
  for (const action of pending) {
>>>>>>> upstream/master
    try {
      const res = await fetch("/api/attendance/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action.data),
      });
      if (res.ok) {
        await removePendingAction(action.id);
      } else {
        const retryCount = (action.retryCount || 0) + 1;
        if (retryCount >= 5) {
          await updateActionStatus(action.id, "failed", retryCount);
        } else {
          await updateActionStatus(action.id, "pending", retryCount);
        }
      }
    } catch {
      const retryCount = (action.retryCount || 0) + 1;
      await updateActionStatus(action.id, "pending", retryCount);
    }
  }
}

<<<<<<< HEAD
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
=======
export function registerBackgroundSync() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.sync.register("sync-attendance").catch(() => {});
>>>>>>> upstream/master
  });
}
