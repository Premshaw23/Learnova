/**
 * ============================================================================
 * 🎨 OFFLINE SYNC TRACKER (Upgraded for Issue #4224)
 * ============================================================================
 * Enhanced sync status component with:
 *   - Real-time sync status from unified storage
 *   - Conflict indicator with resolution actions
 *   - Sync progress visualization
 *   - Detailed queue breakdown
 */

import React, { useState, useEffect, useCallback } from "react";
import { getSyncStatus, onSyncEvent, retryFailedRecords } from "@/lib/offlineSync";
import { getStorageStats } from "@/lib/offlineStorage";

const OfflineSyncTracker = ({
  courseId,
  currentModuleId,
  currentProgress,
  showDetails = false,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // ---- Load initial status ----
  const loadStatus = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      setSyncStatus(status);
      const storageStats = await getStorageStats();
      setStats(storageStats);
    } catch (err) {
      console.error("[SyncTracker] Failed to load status:", err);
    }
  }, []);

  // ---- Monitor online/offline status ----
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      loadStatus();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadStatus]);

  // ---- Subscribe to sync events ----
  useEffect(() => {
    const unsubs = [
      onSyncEvent("start", () => setIsSyncing(true)),
      onSyncEvent("complete", () => {
        setIsSyncing(false);
        loadStatus();
      }),
      onSyncEvent("error", () => {
        setIsSyncing(false);
        loadStatus();
      }),
      onSyncEvent("conflict", () => loadStatus()),
    ];

    loadStatus();

    return () => unsubs.forEach((unsub) => unsub());
  }, [loadStatus]);

  // ---- Auto-sync when coming back online ----
  useEffect(() => {
    if (isOnline && syncStatus?.pending > 0 && !isSyncing) {
      // Trigger background sync via service worker
      if (
        typeof navigator !== "undefined" &&
        navigator.serviceWorker?.controller
      ) {
        navigator.serviceWorker.controller.postMessage({
          type: "TRIGGER_SYNC_PENDING_ACTIONS",
        });
      }
    }
  }, [isOnline, syncStatus?.pending, isSyncing]);

  // ---- Queue progress items locally when offline ----
  useEffect(() => {
    if (!isOnline && currentProgress !== undefined) {
      try {
        const savedQueue = JSON.parse(
          localStorage.getItem("learnova_offline_sync_queue") || "[]"
        );
        savedQueue.push({
          courseId,
          currentModuleId,
          progress: currentProgress,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem(
          "learnova_offline_sync_queue",
          JSON.stringify(savedQueue.slice(-50)) // Keep last 50
        );
      } catch (error) {
        console.error("[SyncTracker] Failed to save offline queue:", error);
      }
    }
  }, [currentProgress, isOnline, courseId, currentModuleId]);

  // ---- Retry failed records ----
  const handleRetryFailed = async () => {
    try {
      setIsSyncing(true);
      await retryFailedRecords();
      loadStatus();
    } catch (err) {
      console.error("[SyncTracker] Retry failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // ---- Status color/badge config ----
  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        label: "Offline",
        color: "bg-gray-100 text-gray-800",
        dot: "bg-gray-500",
        icon: "📡",
      };
    }

    if (isSyncing) {
      return {
        label: "Syncing…",
        color: "bg-indigo-100 text-indigo-800",
        dot: "bg-indigo-500 animate-pulse",
        icon: "🔄",
      };
    }

    if (syncStatus?.conflict > 0) {
      return {
        label: "Conflicts",
        color: "bg-amber-100 text-amber-800",
        dot: "bg-amber-500",
        icon: "⚠️",
      };
    }

    if (syncStatus?.failed > 0) {
      return {
        label: "Sync Issues",
        color: "bg-red-100 text-red-800",
        dot: "bg-red-500",
        icon: "❌",
      };
    }

    if (syncStatus?.pending > 0) {
      return {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        dot: "bg-yellow-500",
        icon: "⏳",
      };
    }

    return {
      label: "Synced",
      color: "bg-emerald-100 text-emerald-800",
      dot: "bg-emerald-500",
      icon: "✅",
    };
  };

  const statusConfig = getStatusConfig();

  // ---- Progress bar ----
  const syncProgress = stats && stats.total > 0
    ? Math.round((stats.synced / stats.total) * 100)
    : 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm max-w-md mx-auto my-4 transition-all duration-300">
      {/* Main Header */}
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {isOnline && !isSyncing && syncStatus?.pending === 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${statusConfig.dot}`}
            />
          </span>
          <div>
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Network &amp; Sync Telemetry
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">
              Mode:{" "}
              {isOnline ? "Online (Cloud)" : "Offline (Local Cache)"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wide border ${statusConfig.color}`}
          >
            {statusConfig.icon} {statusConfig.label}
          </span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Sync Progress Bar */}
      {stats && stats.total > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Sync Progress</span>
            <span>{syncProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* Queue Breakdown */}
          {stats && (
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Pending", value: stats.pending, color: "text-yellow-600" },
                { label: "Synced", value: stats.synced, color: "text-emerald-600" },
                { label: "Conflict", value: stats.conflict, color: "text-amber-600" },
                { label: "Failed", value: stats.failed, color: "text-red-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center">
                  <div className={`text-lg font-bold ${color}`}>{value}</div>
                  <div className="text-[9px] text-slate-400 uppercase">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Last Sync Time */}
          {syncStatus?.lastSyncAt && (
            <p className="text-[10px] text-slate-400 text-center">
              Last synced: {new Date(syncStatus.lastSyncAt).toLocaleString()}
            </p>
          )}

          {/* Retry Button */}
          {syncStatus?.failed > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={isSyncing}
              className="w-full text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {isSyncing ? "Retrying…" : `Retry ${syncStatus.failed} Failed Items`}
            </button>
          )}
        </div>
      )}

      {/* Offline Warning Banner */}
      {!isOnline && (
        <div className="mx-4 mb-4 p-2.5 bg-amber-50 rounded-lg border border-amber-100 text-[10px] text-amber-700 font-medium leading-relaxed">
          ⚠️ Connection interrupted. Your progress is cached locally and will
          sync automatically when you&apos;re back online.
        </div>
      )}
    </div>
  );
};

export default OfflineSyncTracker;
