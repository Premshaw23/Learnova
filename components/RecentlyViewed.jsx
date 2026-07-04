"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRecentlyViewed,
  clearRecentlyViewed,
} from "@/lib/recentlyViewed";

export default function RecentlyViewed() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  const handleClear = () => {
    clearRecentlyViewed();
    setItems([]);
  };

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Recently Viewed
        </h2>

        <button
          onClick={handleClear}
          className="text-red-400 text-sm"
        >
          Clear
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.url}
            className="block rounded-lg bg-slate-800 p-3 hover:bg-slate-700"
          >
            <p className="font-medium">
              {item.title}
            </p>

            <p className="text-xs text-slate-400">
              {item.type}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              {new Date(item.viewedAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}