import { getOutboxRecords, removeFromOutbox } from "./offlineStore";
import { getAuth } from "firebase/auth";
import { ensureClientCsrfToken, getClientCsrfToken } from "./csrf";

/**
 * Attempts to flush the attendance outbox to the server.
 * This can be called by the frontend (online event listener) or the Service Worker.
 */
export async function syncAttendanceQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return;

  const records = await getOutboxRecords();
  if (records.length === 0) return;

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

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncAttendanceQueue();
  });
}

