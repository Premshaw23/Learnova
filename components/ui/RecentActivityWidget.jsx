"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getRecentActivities, clearRecentActivities } from "@/utils/recentActivity";
import {
  clearRecentlyVisitedPages,
  getRecentlyVisitedPages,
} from "@/utils/recentlyVisitedPages";
import { getRouteDisplayName, getRouteIcon } from "@/lib/navigation";

function timeAgo(ts) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export default function RecentActivityWidget({ maxItems = 8, storageType = "activity" }) {
  const [items, setItems] = useState([]);

  const isPagesMode = storageType === "pages";
  const widgetTitle = isPagesMode ? "Recently Visited Pages" : "Recent Activity";
  const emptyStateMessage = isPagesMode
    ? "No recently visited pages yet"
    : "No recent learning activity yet";

  useEffect(() => {
    try {
      const loader = isPagesMode ? getRecentlyVisitedPages : getRecentActivities;
      const list = loader().slice(0, maxItems);
      setItems(list);
    } catch (e) {
      setItems([]);
    }
  }, [maxItems, isPagesMode]);

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <h3 className="text-sm font-bold text-zinc-200 mb-2">{widgetTitle}</h3>
        <div className="text-sm text-zinc-500 italic">{emptyStateMessage}</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-200">{widgetTitle}</h3>
        <button
          onClick={() => {
            if (isPagesMode) {
              clearRecentlyVisitedPages();
            } else {
              clearRecentActivities();
            }
            setItems([]);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => {
          const PageIcon = isPagesMode ? getRouteIcon(it.path) : null;
          const href = it?.path;

          const content = (
            <div className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
              <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
                {it.thumbnail ? (
                  <img src={it.thumbnail} alt="" className="w-full h-full object-cover rounded-md" />
                ) : PageIcon ? (
                  <PageIcon className="w-4 h-4" />
                ) : it.type ? (
                  it.type[0]
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-zinc-100 truncate">
                  {isPagesMode ? getRouteDisplayName(it.path, it.name) : it.title}
                </div>
                <div className="text-xs text-zinc-500 flex items-center gap-2">
                  <span>{isPagesMode ? "Page" : it.type || "Page"}</span>
                  <span className="opacity-60">•</span>
                  <span className="font-mono">{timeAgo(it.timestamp)}</span>
                </div>
              </div>
            </div>
          );

          // If there is a valid href, render as a Link; otherwise render a non-interactive container
          if (href) {
            return (
              <Link key={(it.id || it.path || it.title) + it.timestamp} href={href}>
                {content}
              </Link>
            );
          }

          return (
            <div key={(it.id || it.title) + it.timestamp}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
