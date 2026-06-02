"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getRecentActivities, clearRecentActivities } from "@/utils/recentActivity";

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

export default function RecentActivityWidget({ maxItems = 8 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const list = getRecentActivities().slice(0, maxItems);
      setItems(list);
    } catch (e) {
      console.error(e);
    }
  }, [maxItems]);

  if (!items || items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
        <h3 className="text-sm font-bold text-zinc-200 mb-2">Recent Activity</h3>
        <div className="text-sm text-zinc-500 italic">No recent learning activity yet</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-zinc-200">Recent Activity</h3>
        <button
          onClick={() => { clearRecentActivities(); setItems([]); }}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-2">
        {items.map((it) => (
          <Link key={it.id + it.timestamp} href={it.path} className="group flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900/50 transition-colors">
            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center text-indigo-400 text-sm font-bold shrink-0">
              {it.thumbnail ? <img src={it.thumbnail} alt="" className="w-full h-full object-cover rounded-md" /> : (it.type ? it.type[0] : <Clock className="w-4 h-4" />)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-100 truncate">{it.title}</div>
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <span>{it.type || "Page"}</span>
                <span className="opacity-60">•</span>
                <span className="font-mono">{timeAgo(it.timestamp)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
