"use client";

import { useState } from "react";
import { UserCheck, Clock, RefreshCw } from "lucide-react";
import { useRealtimeAttendance } from "@/hooks/useRealtimeAttendance";

const statusColors = {
  present: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200",
  late: "amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200",
};

function timeAgo(date) {
  if (!date) return "just now";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function LiveAttendanceView({ className, title = "Live Check-Ins" }) {
  const { liveCheckIns, clearCheckIns } = useRealtimeAttendance({ classFilter: className });
  const [isPaused, setIsPaused] = useState(false);

  const visible = isPaused ? [] : liveCheckIns;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
          {liveCheckIns.length > 0 && !isPaused && (
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {liveCheckIns.length > 0 && (
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
          )}
          <button
            type="button"
            onClick={clearCheckIns}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
            aria-label="Clear check-ins"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-sm text-zinc-400 dark:text-zinc-500">
            <UserCheck className="h-8 w-8" />
            <p>Waiting for live check-ins...</p>
          </div>
        ) : (
          visible.map((record) => (
            <div
              key={record.id}
              className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300">
                {record.studentName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {record.studentName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      statusColors[record.status] || statusColors.present
                    }`}
                  >
                    {record.status}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                    <Clock className="h-3 w-3" />
                    {timeAgo(record.timestamp)}
                  </span>
                </div>
              </div>
              {record.className && (
                <span className="shrink-0 text-[11px] text-zinc-400">{record.className}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
