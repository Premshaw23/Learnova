import React, { useState, useEffect } from "react";
import { syncPendingQuizzes } from "../services/offlineSyncService";

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      setIsOnline(true);
      try {
        const res = await syncPendingQuizzes();
        if (res && res.successCount > 0) {
          setSyncStatus(`Synced ${res.successCount} offline items!`);
          setTimeout(() => setSyncStatus(null), 4000);
        }
      } catch (err) {
        console.error("Auto sync failed:", err);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (syncStatus) {
    return (
      <div className="fixed bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50 animate-bounce">
        <span>✓ {syncStatus}</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm z-50">
      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
      <span>Offline Mode — Changes will sync when reconnected</span>
    </div>
  );
}
