import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Custom React hook to listen for service worker offline queue messages,
 * handle network recovery, and display hot toasts when mutations are queued or replayed.
 */
export function useOfflineQueue() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      if (!event.data) return;

      switch (event.data.type) {
        case "MUTATION_QUEUED":
          toast.loading("Device is offline. Request queued for replay when online.", {
            id: "offline-mutation-queued",
            duration: 4000,
          });
          // Dispatch custom event for UI components to update their status
          window.dispatchEvent(new CustomEvent("learnova:mutation-queued"));
          break;

        case "MUTATIONS_SYNC_COMPLETE":
          const { successCount, failCount } = event.data;
          
          // Clear any queued loading toast
          toast.dismiss("offline-mutation-queued");

          if (failCount === 0) {
            toast.success(`Connection restored! Replayed ${successCount} queued request(s) successfully.`, {
              id: "offline-mutation-sync",
              duration: 5000,
              icon: "⚡",
            });
          } else {
            toast.error(`Replayed queued requests: ${successCount} succeeded, ${failCount} failed.`, {
              id: "offline-mutation-sync",
              duration: 6000,
            });
          }
          // Dispatch custom event for UI updates
          window.dispatchEvent(
            new CustomEvent("learnova:mutations-sync-complete", {
              detail: { successCount, failCount },
            })
          );
          break;

        default:
          break;
      }
    };

    const handleOnline = async () => {
      // Trigger background sync registration
      if ("SyncManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.sync.register("sync-offline-mutations");
        } catch (error) {
          console.warn("Background sync registration failed, falling back to message sync trigger:", error);
          navigator.serviceWorker.controller?.postMessage({
            type: "TRIGGER_MUTATION_SYNC",
          });
        }
      } else {
        // Fallback for browsers without SyncManager (e.g. Safari)
        navigator.serviceWorker.controller?.postMessage({
          type: "TRIGGER_MUTATION_SYNC",
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    window.addEventListener("online", handleOnline);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      window.removeEventListener("online", handleOnline);
    };
  }, []);
}
