import { useEffect, useState, useCallback } from "react";
import { getPendingActions } from "../db/offlineStore";
import toast from "react-hot-toast";

export function useOfflineSync() {
  const [queueCount, setQueueCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState("idle");

  const refreshQueue = useCallback(async () => {
    try {
      const actions = await getPendingActions();
      setQueueCount(actions.length);
    } catch (err) {
      console.error("Failed to read pending actions:", err);
    }
  }, []);

  useEffect(() => {
    refreshQueue();

    const handleOfflineActionQueued = () => {
      refreshQueue();
      toast.success("Action saved locally", { id: "offline-action-saved" });
    };

    const handleSyncComplete = (event) => {
      refreshQueue();
      const { successCount, failCount } = event.detail;
      toast.dismiss("offline-syncing");
      
      if (successCount > 0 && failCount === 0) {
        toast.success(`Synchronization completed`, { id: "sync-complete" });
      } else if (failCount > 0) {
        toast.error(`Sync finished with errors.`, { id: "sync-error" });
      }
      setSyncStatus("idle");
    };

    const handleSyncStart = () => {
      setSyncStatus("syncing");
      toast.loading("Synchronizing pending actions...", { id: "offline-syncing" });
    };

    const handleOnline = () => {
      if (!("SyncManager" in window)) {
        handleSyncStart();
        navigator.serviceWorker.controller?.postMessage({ type: "TRIGGER_SYNC_PENDING_ACTIONS" });
      }
    };

    const handleMessage = (event) => {
      if (!event.data) return;
      if (event.data.type === "SYNC_PENDING_ACTIONS_START") {
        handleSyncStart();
      } else if (event.data.type === "SYNC_PENDING_ACTIONS_COMPLETE") {
        window.dispatchEvent(new CustomEvent("learnova:sync-complete", {
          detail: { successCount: event.data.successCount, failCount: event.data.failCount }
        }));
      }
    };

    window.addEventListener("learnova:offline-action-queued", handleOfflineActionQueued);
    window.addEventListener("learnova:sync-complete", handleSyncComplete);
    window.addEventListener("online", handleOnline);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("learnova:offline-action-queued", handleOfflineActionQueued);
      window.removeEventListener("learnova:sync-complete", handleSyncComplete);
      window.removeEventListener("online", handleOnline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [refreshQueue]);

  return { queueCount, syncStatus, refreshQueue };
}
