import { addPendingAction } from "../db/offlineStore";

export async function handleOfflineRequest(endpoint, options = {}) {
  // We only queue mutations (POST, PUT, PATCH, DELETE)
  const method = (options.method || "GET").toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    throw new Error("Network error"); // Let GET requests fail normally
  }

  const actionType = endpoint.includes("/attendance")
    ? "attendance"
    : endpoint.includes("/complaints")
      ? "complaint"
      : endpoint.includes("/exceptions")
        ? "exception"
        : "general";

  await addPendingAction({
    type: actionType,
    endpoint,
    method,
    headers: options.headers,
    payload: options.body,
  });

  // Attempt to register background sync
  if ("serviceWorker" in navigator && "SyncManager" in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register("sync-pending-actions");
    } catch (err) {
      console.warn("Background sync registration failed:", err);
    }
  }

  // Notify UI
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("learnova:offline-action-queued", {
        detail: { type: actionType, endpoint },
      })
    );
  }

  // Return a mock successful response
  return new Response(
    JSON.stringify({
      success: true,
      queuedOffline: true,
      message:
        "Action saved locally. It will be synchronized when you are back online.",
    }),
    {
      status: 202, // Accepted
      headers: { "Content-Type": "application/json" },
    }
  );
}

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
