"use client";

import React, { useState, useEffect } from "react";
import { CloudOff, RefreshCw, CheckCircle, Database } from "lucide-react";
import { getOutboxRecords } from "@/lib/offlineStore";
import { syncAttendanceQueue } from "@/lib/syncService";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const checkQueue = async () => {
    try {
      const records = await getOutboxRecords();
      setQueueCount(records.length);
    } catch (e) {
      console.error("Failed to check queue", e);
    }
  };

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    checkQueue();

    const handleOnline = async () => {
      setIsOffline(false);
      setIsSyncing(true);
      await syncAttendanceQueue();
      await checkQueue();
      setIsSyncing(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      checkQueue();
    };

    const handleSyncComplete = (event) => {
      // Event emitted by syncService or service worker message
      checkQueue();
    };

    const handleMessage = (event) => {
      if (event.data && event.data.type === "SYNC_COMPLETE") {
        checkQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("attendance-sync-complete", handleSyncComplete);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    // Poll queue every 10 seconds just in case
    const interval = setInterval(checkQueue, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("attendance-sync-complete", handleSyncComplete);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, []);

  if (!isOffline && queueCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {isOffline && (
        <div className="bg-red-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-pulse">
          <CloudOff className="w-4 h-4" />
          Offline Mode
        </div>
      )}

      {queueCount > 0 && !isSyncing && (
        <div className="bg-yellow-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <Database className="w-4 h-4" />
          {queueCount} record{queueCount !== 1 ? "s" : ""} queued
        </div>
      )}

      {isSyncing && (
        <div className="bg-blue-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing records...
        </div>
      )}
      
      {!isOffline && queueCount === 0 && isSyncing === false && (
        <div className="bg-green-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-out" style={{ animationDuration: '3s', animationFillMode: 'forwards' }}>
          <CheckCircle className="w-4 h-4" />
          Synced
        </div>
      )}
    </div>
  );
}
