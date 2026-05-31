"use client";

// fix: serve proper offline fallback page instead of blank screen (fixes #2182)
// Previously uncached routes showed a blank white screen or browser error.
// This page is now registered as the PWA document fallback in next.config.mjs.

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [cachedAttendance, setCachedAttendance] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);

  // Load last-cached attendance data from Cache Storage
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        if ("caches" in window) {
          const cache = await caches.open("api-cache");
          const keys = await cache.keys();
          const attendanceKey = keys.find((k) =>
            k.url.includes("/api/attendance"),
          );
          if (attendanceKey) {
            const response = await cache.match(attendanceKey);
            if (response) {
              const data = await response.json();
              setCachedAttendance(data?.data ?? null);
              // Use the Date header as "last seen" timestamp
              const dateHeader = response.headers.get("date");
              if (dateHeader) {
                setLastSeen(new Date(dateHeader).toLocaleString());
              }
            }
          }
        }
      } catch {
        // Cache API unavailable — silently ignore
      }
    };

    loadCachedData();

    // Listen for the browser coming back online
    const handleOnline = () => setIsOnline(true);
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Retry button — pings /api/auth/me to confirm connectivity before reloading
  const handleRetry = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "HEAD",
        cache: "no-store",
      });
      if (res.ok || res.status === 401) {
        // 401 still means the server responded — we're back online
        window.location.reload();
        return;
      }
    } catch {
      // Still offline
    }
    setIsChecking(false);
  }, []);

  // Auto-reload once the browser detects it's back online
  useEffect(() => {
    if (isOnline) {
      window.location.reload();
    }
  }, [isOnline]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-background">
      <div className="max-w-md w-full space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <WifiOff className="w-9 h-9 text-amber-400" />
          </div>
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            You&apos;re offline
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Learnova can&apos;t reach the internet right now. Check your Wi-Fi
            or mobile data, then tap Retry.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-60"
        >
          <RefreshCw
            className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
          />
          {isChecking ? "Checking connection…" : "Retry"}
        </button>

        {/* Back home link */}
        <Link
          href="/"
          className="block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition"
        >
          Go to home page
        </Link>

        {/* Cached attendance data */}
        {cachedAttendance && (
          <div className="mt-6 text-left rounded-xl border border-border bg-card/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Last cached attendance data
            </div>
            {lastSeen && (
              <p className="text-xs text-muted-foreground">
                Last updated: {lastSeen}
              </p>
            )}
            <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(cachedAttendance, null, 2)}
            </pre>
          </div>
        )}

        {/* Auto-reconnect notice */}
        <p className="text-xs text-muted-foreground">
          This page will reload automatically when your connection is restored.
        </p>
      </div>
    </div>
  );
}