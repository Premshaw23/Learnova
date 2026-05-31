"use client";

import React, { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle, Database } from "lucide-react";
import { getOutboxRecords } from "@/lib/offlineStore";
import { getQueuedMutations } from "@/lib/offlineQueue";
import { syncAttendanceQueue } from "@/lib/syncService";

const SYNCED_BANNER_DURATION_MS = 3000;

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setIsOffline(!navigator.onLine);
    checkQueue();

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

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("attendance-sync-complete", handleSyncComplete);
    window.addEventListener("learnova:mutation-queued", handleLocalEvent);
    window.addEventListener("learnova:mutations-sync-complete", handleLocalEvent);
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    const interval = window.setInterval(checkQueue, 10000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("attendance-sync-complete", handleSyncComplete);
      window.removeEventListener("learnova:mutation-queued", handleLocalEvent);
      window.removeEventListener("learnova:mutations-sync-complete", handleLocalEvent);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let timer;

    if (prevIsSyncing.current && !isSyncing && queueCount === 0 && !isOffline) {
      setJustSynced(true);
      timer = window.setTimeout(() => {
        setJustSynced(false);
      }, SYNCED_BANNER_DURATION_MS);
    }

    prevIsSyncing.current = isSyncing;

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [isOffline, isSyncing, queueCount]);

  if (!isOffline && queueCount === 0 && !isSyncing && !justSynced) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 sm:bottom-4">
      {isOffline && (
        <div className="animate-pulse rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          Offline Mode
        </div>
      )}

      {queueCount > 0 && !isSyncing && (
        <div className="rounded-full bg-yellow-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          <Database className="h-4 w-4" />
          {queueCount} record{queueCount !== 1 ? "s" : ""} queued
        </div>
      )}

      {isSyncing && (
        <div className="rounded-full bg-blue-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Syncing records...
        </div>
      )}

      {justSynced && (
        <div
          className="animate-fade-out rounded-full bg-green-500/90 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md flex items-center gap-2"
          style={{
            animationDuration: `${SYNCED_BANNER_DURATION_MS}ms`,
            animationFillMode: "forwards",
          }}
        >
          <CheckCircle className="h-4 w-4" />
          Synced
        </div>
      )}
    </div>
  );
}
