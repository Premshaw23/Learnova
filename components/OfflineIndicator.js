"use client";

import React, { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle, Database } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const SYNCED_BANNER_DURATION_MS = 3000;

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
<<<<<<< HEAD
  const [queueCount, setQueueCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const prevIsSyncing = useRef(false);

  const checkQueue = async () => {
    try {
      const [records, mutations] = await Promise.all([
        getOutboxRecords(),
        getQueuedMutations(),
      ]);

      setQueueCount(records.length + mutations.length);
    } catch (error) {
      console.error("Failed to check queue", error);
    }
  };
=======
  const { queueCount, syncStatus } = useOfflineSync();
>>>>>>> upstream/master

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setIsOffline(!navigator.onLine);

<<<<<<< HEAD
    const handleOnline = async () => {
      setIsOffline(false);
      await checkQueue();
      setIsSyncing(true);

      try {
        await syncAttendanceQueue();
      } finally {
        setIsSyncing(false);
        await checkQueue();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      checkQueue();
    };

    const handleSyncComplete = () => {
      checkQueue();
    };

    const handleMessage = (event) => {
      const type = event.data?.type;

      if (type === "MUTATIONS_SYNC_COMPLETE") {
        setFailedCount(event.data?.failCount || 0);
      }
      
      if (
        type === "SYNC_COMPLETE" ||
        type === "MUTATIONS_SYNC_COMPLETE" ||
        type === "MUTATION_QUEUED"
      ) {
        checkQueue();
      }
    };

    const handleLocalEvent = () => {
      checkQueue();
    };
=======
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
>>>>>>> upstream/master

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline && queueCount === 0 && syncStatus === "idle") return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 sm:bottom-4">
      {isOffline && (
        <div className="animate-pulse rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          Offline Mode
        </div>
      )}

      {queueCount > 0 && syncStatus !== "syncing" && (
        <div className="bg-yellow-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <Database className="w-4 h-4" />
          {queueCount} record{queueCount !== 1 ? "s" : ""} queued
        </div>
      )}

<<<<<<< HEAD
      {failedCount > 0 && (
        <div className="rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          ❌ {failedCount} sync failed
        </div>
      )}

      {isSyncing && (
        <div className="rounded-full bg-blue-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
=======
      {syncStatus === "syncing" && (
        <div className="bg-blue-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
>>>>>>> upstream/master
          Syncing records...
        </div>
      )}
      
      {!isOffline && queueCount === 0 && syncStatus === "idle" && (
        <div className="bg-green-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-out" style={{ animationDuration: '3s', animationFillMode: 'forwards' }}>
          <CheckCircle className="w-4 h-4" />
          Synced
        </div>
      )}
    </div>
  );
}
