"use client";

import React, { useEffect, useRef, useState } from "react";
import { CloudOff, RefreshCw, CheckCircle, Database } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const SYNCED_BANNER_DURATION_MS = 3000;

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const { queueCount, syncStatus } = useOfflineSync();

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

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

      {syncStatus === "syncing" && (
        <div className="bg-blue-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing records...
        </div>
      )}

      {!isOffline && queueCount === 0 && syncStatus === "idle" && (
        <div
          className="bg-green-500/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium animate-fade-out"
          style={{ animationDuration: "3s", animationFillMode: "forwards" }}
        >
          <CheckCircle className="w-4 h-4" />
          Synced
        </div>
      )}
    </div>
  );
}
