/**
 * ============================================================================
 * 🏷️ SYNC STATUS BADGE (Upgraded for Issue #4224)
 * ============================================================================
 * Enhanced badge component with real-time sync status visualization.
 * Now supports conflict indicator, retry action, and detailed tooltip.
 */

import React, { useState, useEffect, useCallback } from "react";
import { getSyncStatus, retryFailedRecords, onSyncEvent } from "@/lib/offlineSync";

/**
 * Sync status badge that reflects the unified storage state.
 *
 * @param {Object} props
 * @param {string} [props.syncState] - Legacy prop: 'online' | 'offline' | 'retrying' | 'error'
 * @param {boolean} [props.showRetry] - Show retry button when there are failures
 * @param {boolean} [props.compact] - Compact mode (fewer details)
 */
export default function SyncStatusBadge({
  syncState: legacySyncState,
  showRetry = false,
  compact = false,
}) {
  const [status, setStatus] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadStatus = useCallback(async () => {
    try {
      const s = await getSyncStatus();
      setStatus(s);
    } catch {
      // ignore
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const goOnline = () => { setIsOnline(true); loadStatus(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [loadStatus]);

  // Subscribe to sync events
  useEffect(() => {
    const unsubs = [
      onSyncEvent("complete", loadStatus),
      onSyncEvent("conflict", loadStatus),
      onSyncEvent("error", loadStatus),
    ];
    loadStatus();
    return () => unsubs.forEach((u) => u());
  }, [loadStatus]);

  // Resolve the display state
  const resolveState = () => {
    // If the parent passes a legacy syncState, use it as a fallback
    if (legacySyncState) {
      const legacyMap = {
        online: { text: "Synced", styles: "bg-green-100 text-green-800", icon: "✅" },
        offline: { text: "Offline Mode", styles: "bg-gray-100 text-gray-800", icon: "📡" },
        retrying: { text: "Retrying…", styles: "bg-yellow-100 text-yellow-800 animate-pulse", icon: "🔄" },
        error: { text: "Sync Issues", styles: "bg-red-100 text-red-800", icon: "❌" },
      };
      if (legacySyncState in legacyMap) return legacyMap[legacySyncState];
    }

    // Use real status from unified storage
    if (!isOnline) {
      return { text: "Offline", styles: "bg-gray-100 text-gray-800", icon: "📡" };
    }
    if (isRetrying) {
      return { text: "Retrying…", styles: "bg-yellow-100 text-yellow-800 animate-pulse", icon: "🔄" };
    }

    const st = status?.status;
    switch (st) {
      case "syncing":
        return { text: "Syncing…", styles: "bg-indigo-100 text-indigo-800 animate-pulse", icon: "🔄" };
      case "pending":
        return { text: `${status.pending} Pending`, styles: "bg-yellow-100 text-yellow-800", icon: "⏳" };
      case "conflict":
        return { text: "Conflicts", styles: "bg-amber-100 text-amber-800", icon: "⚠️" };
      case "error":
        return { text: "Sync Issues", styles: "bg-red-100 text-red-800", icon: "❌" };
      default:
        return { text: "Synced", styles: "bg-green-100 text-green-800", icon: "✅" };
    }
  };

  const config = resolveState();

  const handleRetry = async (e) => {
    e.stopPropagation();
    setIsRetrying(true);
    try {
      await retryFailedRecords();
      await loadStatus();
    } catch {
      // ignore
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.styles}`}
        title={status ? `Pending: ${status.pending} | Synced: ${status.synced} | Conflict: ${status.conflict} | Failed: ${status.failed}` : ""}
      >
        {status?.status === "syncing" || isRetrying ? (
          <svg
            className="animate-spin -ml-1 mr-1 h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className="mr-1 text-[10px]">{config.icon}</span>
        )}
        {config.text}
      </div>

      {/* Retry button */}
      {showRetry && status?.failed > 0 && !isRetrying && (
        <button
          onClick={handleRetry}
          className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-medium"
        >
          Retry
        </button>
      )}

      {/* Conflict detail (non-compact) */}
      {!compact && status?.conflict > 0 && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer"
          title="Conflicts need manual review"
        >
          {status.conflict} need review
        </span>
      )}
    </div>
  );
}
