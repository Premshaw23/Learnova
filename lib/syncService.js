import {
  getPendingActions,
  updateActionStatus,
  removePendingAction,
} from "@/db/offlineStore";

export async function syncAttendanceQueue() {
  if (typeof window === "undefined") return;
  if (!navigator.onLine) return;

  const pending = await getPendingActions();
  for (const action of pending) {
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

export function registerBackgroundSync() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    reg.sync.register("sync-attendance").catch(() => {});
  });
}
