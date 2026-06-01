"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, LayoutGrid, Terminal, Database, Palette } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "web-dev", label: "Web Dev", icon: Terminal },
  { id: "data-science", label: "Data Science", icon: Database },
  { id: "design", label: "Design", icon: Palette },
];

export default function CourseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current query parameters with clean default fallbacks
  const currentCategory = searchParams.get("category") || "all";
  const currentSearch = searchParams.get("q") || "";

  const [searchVal, setSearchVal] = useState(currentSearch);

  // Sync input value if URL changes externally (e.g. navigation, back button)
  useEffect(() => {
    setSearchVal(currentSearch);
  }, [currentSearch]);

  // Debounced search logic to avoid continuous URL history updates while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal.trim() !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchVal.trim()) {
          params.set("q", searchVal.trim());
        } else {
          params.delete("q");
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchVal, pathname, router, searchParams, currentSearch]);

  const handleCategorySelect = (categoryId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId && categoryId !== "all") {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleClearSearch = () => {
    setSearchVal("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-200" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search courses by title, instructor, or description..."
            className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500/50 rounded-2xl py-3.5 pl-12 pr-10 text-white placeholder-slate-400 outline-hidden focus:ring-4 focus:ring-indigo-500/10 backdrop-blur-md transition-all duration-300 shadow-inner"
          />
          {searchVal && (
            <button
              onClick={handleClearSearch}
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info metrics tag */}
        <div className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs text-slate-400 font-semibold uppercase tracking-wider backdrop-blur-sm self-center">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Realtime search synced
        </div>
      </div>

      {/* Category Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
          Filter by Category
        </label>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = currentCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                type="button"
                className={`inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full text-sm font-semibold tracking-wide border cursor-pointer select-none transition-all duration-300 active:scale-95 ${
                  isSelected
                    ? "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white border-transparent shadow-lg shadow-indigo-600/20"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isSelected ? "scale-110" : ""}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
