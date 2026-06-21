"use client";

import {
  CalendarDays,
  Filter,
  Tag,
  Clock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const DATE_OPTIONS = [
  { id: "all", label: "All dates" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
];

const PRIORITY_OPTIONS = [
  { id: "all", label: "All priorities" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

// Animated button component for consistency
const FilterButton = ({
  isSelected,
  children,
  onClick,
  variant = "default",
}) => {
  const baseClasses =
    "rounded-2xl px-3 py-2 text-sm transition active:scale-95";
  const selectedClasses = isSelected
    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
    : "bg-slate-800 text-slate-300 hover:bg-slate-700";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${selectedClasses}`}
    >
      {children}
    </motion.button>
  );
};

const NoticeFilters = ({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedPriority,
  onPriorityChange,
  availableTags,
  selectedTags,
  onTagToggle,
  selectedDateRange,
  onDateRangeChange,
  sortOrder,
  onSortOrderChange,
  showOnlyUnread,
  onToggleUnread,
  onReset,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950/10 backdrop-blur-xl transition-all duration-300">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"
      >
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            <Filter className="h-4 w-4" />
            <span>Smart filters</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Narrow results by category, priority, tags, date range, and read
            status.
          </p>
        </motion.div>

        {onReset && (
          <motion.button
            variants={itemVariants}
            type="button"
            onClick={onReset}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold border border-slate-800 bg-slate-900 text-slate-200 hover:border-indigo-500 transition active:scale-95 cursor-pointer"
          >
            Reset Filters
          </motion.button>
        )}

        <motion.button
          variants={itemVariants}
          type="button"
          onClick={onToggleUnread}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition active:scale-95 ${
            showOnlyUnread
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
              : "border border-slate-800 bg-slate-900 text-slate-200 hover:border-indigo-500"
          }`}
        >
          <Clock className="h-4 w-4" />
          {showOnlyUnread ? "Show all notices" : "Show unread only"}
        </motion.button>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 grid gap-4 lg:grid-cols-2"
      >
        {/* Category Filter */}
        <motion.div
          variants={itemVariants}
          className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Category</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
              <Tag className="h-3.5 w-3.5" />
              {selectedCategory === "all"
                ? "All"
                : categories.find((item) => item.id === selectedCategory)
                    ?.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <FilterButton
                key={category.id}
                isSelected={selectedCategory === category.id}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.label}
              </FilterButton>
            ))}
          </div>
        </motion.div>

        {/* Priority Filter */}
        <motion.div
          variants={itemVariants}
          className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span className="font-semibold text-slate-100">Priority</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
              <Sparkles className="h-3.5 w-3.5" />
              {selectedPriority === "all" ? "All" : selectedPriority}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_OPTIONS.map((option) => (
              <FilterButton
                key={option.id}
                isSelected={selectedPriority === option.id}
                onClick={() => onPriorityChange(option.id)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Date Range, Tags, and Sort Order */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mt-6 grid gap-4 lg:grid-cols-3"
      >
        {/* Date Range */}
        <motion.div
          variants={itemVariants}
          className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <CalendarDays className="h-4 w-4" />
            Date range
          </div>
          <div className="grid gap-2">
            {DATE_OPTIONS.map((option) => (
              <FilterButton
                key={option.id}
                isSelected={selectedDateRange === option.id}
                onClick={() => onDateRangeChange(option.id)}
              >
                {option.label}
              </FilterButton>
            ))}
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          variants={itemVariants}
          className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Tag className="h-4 w-4" />
            <span>
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableTags.length > 0 ? (
              availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <FilterButton
                    key={tag}
                    isSelected={isSelected}
                    onClick={() => onTagToggle(tag)}
                  >
                    #{tag}
                  </FilterButton>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-2">No tags available</p>
            )}
          </div>
        </motion.div>

        {/* Sort Order */}
        <motion.div
          variants={itemVariants}
          className="space-y-3 rounded-3xl border border-slate-800 bg-slate-900/80 p-4"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Clock className="h-4 w-4" />
            Sort order
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value)}
              className="w-full appearance-none rounded-3xl border border-slate-800 bg-slate-950/90 px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              {SORT_OPTIONS.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  className="bg-slate-950 text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default NoticeFilters;
