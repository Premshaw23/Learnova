"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Search, XCircle, Sparkles, TrendingUp, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NoticeSearch = ({
  value,
  onSearchChange,
  onClearFilters,
  resultsCount,
  activeFilterCount,
  suggestions = [],
  onSuggestionSelect,
}) => {
  const [localSearch, setLocalSearch] = useState(value || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // Filter suggestions based on search input
  const filteredSuggestions = useMemo(() => {
    if (!localSearch.trim()) return [];
    const query = localSearch.toLowerCase();
    return suggestions
      .filter((suggestion) => suggestion.toLowerCase().includes(query))
      .slice(0, 6);
  }, [localSearch, suggestions]);

  useEffect(() => {
    setLocalSearch(value || "");
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onSearchChange(localSearch.trim());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(filteredSuggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalSearch(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onSuggestionSelect?.(suggestion);
  };

  return (
    <div ref={containerRef} className="sticky top-20 z-40 rounded-[2rem] border border-slate-800 bg-slate-950/95 px-5 py-4 shadow-2xl shadow-slate-950/20 backdrop-blur-xl transition-all duration-300 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <label htmlFor="notice-search" className="sr-only">
            Search notices
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              id="notice-search"
              type="search"
              value={localSearch}
              onChange={(event) => {
                setLocalSearch(event.target.value);
                setShowSuggestions(true);
                setHighlightedIndex(-1);
              }}
              onFocus={() => localSearch && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search notices, categories, tags or keywords"
              className="w-full rounded-3xl border border-slate-800 bg-slate-900/90 py-3 pl-12 pr-12 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions && filteredSuggestions.length > 0}
            />
            {localSearch ? (
              <button
                type="button"
                onClick={() => {
                  setLocalSearch("");
                  setShowSuggestions(false);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                aria-label="Clear search"
              >
                <XCircle className="h-5 w-5" />
              </button>
            ) : null}

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && filteredSuggestions.length > 0 && (
                <motion.ul
                  id="suggestions-list"
                  role="listbox"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-lg shadow-2xl shadow-slate-950/30"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <motion.li
                      key={`${suggestion}-${index}`}
                      role="option"
                      aria-selected={highlightedIndex === index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-4 py-3 text-left text-sm transition ${
                          highlightedIndex === index
                            ? "bg-indigo-600/20 text-indigo-200"
                            : "text-slate-300 hover:text-indigo-200"
                        } ${index === 0 ? "rounded-t-3xl" : ""} ${
                          index === filteredSuggestions.length - 1 ? "rounded-b-3xl" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {index < 2 ? (
                            <TrendingUp className="h-4 w-4 text-indigo-400/60" />
                          ) : (
                            <Clock className="h-4 w-4 text-slate-500/60" />
                          )}
                          <span className="truncate">{suggestion}</span>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>


          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>{resultsCount} result{resultsCount === 1 ? "" : "s"}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/80 px-2 py-1 text-slate-300">
              {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-slate-300">
              <Sparkles className="h-4 w-4 text-indigo-300" /> Instant updates
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearFilters}
          className="shrink-0 rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 active:scale-95"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
};

export default NoticeSearch;
