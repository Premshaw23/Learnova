"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "@/hooks/useAuth";
import { useNotices } from "@/contexts/FirestoreContext";
import { Navbar } from "./Navbar";
import NoticeSearch from "./NoticeSearch";
import NoticeFilters from "./NoticeFilters";
import NoticeCard from "./NoticeCard";
import EmptyNoticeState from "./EmptyNoticeState";
import NoticeSkeleton from "./NoticeSkeleton";

const CATEGORIES = [
  { id: "all", label: "All Notices" },
  { id: "academic", label: "Academic" },
  { id: "administrative", label: "Administrative" },
  { id: "financial", label: "Financial" },
  { id: "general", label: "General" },
  { id: "technical", label: "Technical" },
];

const SmartNoticeBoard = () => {
  const { user, loading: authLoading } = useAuth();

  // ── Consume the shared pooled subscription from FirestoreContext ──────────
  // No local onSnapshot — notices arrive from the global singleton listener.
  const { notices: rawNotices, loading: noticesLoading, error: noticesError } = useNotices();

  const [searchQuery, setSearchQuery] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [selectedPriority, setSelectedPriority] =
    useState("all");

  const [selectedTags, setSelectedTags] =
    useState([]);

  const [dateRange, setDateRange] =
    useState("all");

  const [sortOrder, setSortOrder] =
    useState("newest");

  const [showOnlyUnread, setShowOnlyUnread] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const itemsPerPage = 5;

  const [readNotices, setReadNotices] =
    useState(new Set());

  const [activeTab, setActiveTab] =
    useState("notices");

  const [activity] = useState([]);

  const userId =
    user?.uid || user?.id || "anonymous";

  // Normalise createdAt to a JS Date so downstream components can safely call
  // getRelativeTime() regardless of whether it arrived as a Firestore Timestamp
  // or was already converted by firestorePool's snapshot mapper.
  const notices = useMemo(
    () =>
      rawNotices.map((n) => ({
        ...n,
        createdAt:
          n.createdAt instanceof Date
            ? n.createdAt
            : n.createdAt?.toDate
            ? n.createdAt.toDate()
            : new Date(n.createdAt || Date.now()),
      })),
    [rawNotices]
  );

  // Derived activity
  const derivedActivity = useMemo(() => {
    if (activity?.length > 0) {
      return activity;
    }

    return (notices || [])
      .slice(0, 5)
      .map((notice, idx) => ({
        id: notice?.id || idx,
        title: notice?.title || "Untitled",
        timestamp:
          notice?.createdAt || new Date(),
        user: notice?.author || "System",
        type: notice?.isPinned
          ? "pin"
          : notice?.priority === "high"
          ? "urgent"
          : "create",
      }));
  }, [activity, notices]);

  const loading = authLoading || noticesLoading;

  // Show toast once if the pool reports an error
  useEffect(() => {
    if (noticesError) {
      toast.error("Failed to load notices");
    }
  }, [noticesError]);

  // Load persisted read-state from localStorage
  useEffect(() => {
    if (!userId || userId === "anonymous") return;
    try {
      const saved = localStorage.getItem(`readNotices_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setReadNotices(new Set(parsed));
      }
    } catch (err) {
      console.error(
        "Failed to load read notices:",
        err
      );
    }
  }, [userId]);

  // Save read state
  const saveReadState = useCallback(
    (state) => {
      try {
        localStorage.setItem(
          `readNotices_${userId}`,
          JSON.stringify([...state])
        );
      } catch (err) {
        console.error(
          "Failed to save read state:",
          err
        );
      }
    },
    [userId]
  );

  // Mark as read
  const markAsRead = useCallback(
    (noticeId) => {
      setReadNotices((current) => {
        const next = new Set(current);

        next.add(noticeId);

        saveReadState(next);

        return next;
      });
    },
    [saveReadState]
  );

  // Mark as unread
  const markAsUnread = useCallback(
    (noticeId) => {
      setReadNotices((current) => {
        const next = new Set(current);

        next.delete(noticeId);

        saveReadState(next);

        return next;
      });
    },
    [saveReadState]
  );

  // Relative time
  const getRelativeTime = useCallback(
    (date) => {
      const now = new Date();

      const diff =
        now.getTime() -
        new Date(date).getTime();

      const minutes = Math.floor(
        diff / 60000
      );

      if (minutes < 1) {
        return "Just now";
      }

      if (minutes < 60) {
        return `${minutes}m ago`;
      }

      const hours = Math.floor(
        minutes / 60
      );

      if (hours < 24) {
        return `${hours}h ago`;
      }

      const days = Math.floor(hours / 24);

      if (days < 7) {
        return `${days}d ago`;
      }

      return new Date(
        date
      ).toLocaleDateString();
    },
    []
  );

  // Available tags
  const availableTags = useMemo(() => {
    const tags = notices.flatMap(
      (notice) => notice?.tags || []
    );

    return [...new Set(tags)];
  }, [notices]);

  // Suggestions
  const searchOptions = useMemo(() => {
    return notices.map(
      (notice) => notice?.title || ""
    );
  }, [notices]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory !== "all")
      count++;

    if (selectedPriority !== "all")
      count++;

    if (selectedTags.length > 0)
      count++;

    if (dateRange !== "all") count++;

    if (showOnlyUnread) count++;

    return count;
  }, [
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    showOnlyUnread,
  ]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    showOnlyUnread,
    sortOrder,
  ]);

  // Filter notices
  const filteredNotices = useMemo(() => {
    const queryText = searchQuery
      .trim()
      .toLowerCase();

    const now = Date.now();

    return notices
      .filter((notice) => {
        const haystack = `
          ${notice?.title || ""}
          ${notice?.content || ""}
          ${notice?.category || ""}
          ${(notice?.tags || []).join(" ")}
        `.toLowerCase();

        // Search
        if (
          queryText &&
          !haystack.includes(queryText)
        ) {
          return false;
        }

        // Category
        if (
          selectedCategory !== "all" &&
          notice?.category !==
            selectedCategory
        ) {
          return false;
        }

        // Priority
        if (
          selectedPriority !== "all" &&
          notice?.priority !==
            selectedPriority
        ) {
          return false;
        }

        // Tags
        if (
          selectedTags.length > 0 &&
          !selectedTags.every((tag) =>
            notice?.tags?.includes(tag)
          )
        ) {
          return false;
        }

        // Unread
        if (
          showOnlyUnread &&
          readNotices.has(notice.id)
        ) {
          return false;
        }

        // Date range
        const noticeTime = new Date(
          notice?.createdAt
        ).getTime();

        if (dateRange === "today") {
          return (
            now - noticeTime <=
            24 * 60 * 60 * 1000
          );
        }

        if (dateRange === "7d") {
          return (
            now - noticeTime <=
            7 * 24 * 60 * 60 * 1000
          );
        }

        if (dateRange === "30d") {
          return (
            now - noticeTime <=
            30 * 24 * 60 * 60 * 1000
          );
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned first
        if (a.isPinned !== b.isPinned) {
          return a.isPinned ? -1 : 1;
        }

        // Sort order
        if (sortOrder === "oldest") {
          return (
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
          );
        }

        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      });
  }, [
    notices,
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    sortOrder,
    showOnlyUnread,
    readNotices,
  ]);

  // Pagination
  const totalPages = Math.ceil(
    filteredNotices.length / itemsPerPage
  );

  const safeCurrentPage =
    currentPage > totalPages &&
    totalPages > 0
      ? totalPages
      : currentPage;

  const indexOfLastItem =
    safeCurrentPage * itemsPerPage;

  const indexOfFirstItem =
    indexOfLastItem - itemsPerPage;

  const paginatedNotices =
    filteredNotices.slice(
      indexOfFirstItem,
      indexOfLastItem
    );

  // Unread count
  const unreadCount = useMemo(() => {
    return notices.filter(
      (notice) =>
        !readNotices.has(notice.id)
    ).length;
  }, [notices, readNotices]);

  // Clear filters
  const handleClearFilters =
    useCallback(() => {
      setSearchQuery("");
      setSelectedCategory("all");
      setSelectedPriority("all");
      setSelectedTags([]);
      setDateRange("all");
      setSortOrder("newest");
      setShowOnlyUnread(false);
      setCurrentPage(1);
    }, []);

  // Toggle tags
  const handleTagToggle = useCallback(
    (tag) => {
      setSelectedTags((current) =>
        current.includes(tag)
          ? current.filter(
              (item) => item !== tag
            )
          : [...current, tag]
      );
    },
    []
  );

  // Suggestion select
  const handleSuggestionSelect =
    useCallback((suggestion) => {
      setSearchQuery(suggestion);
    }, []);

  // Loading UI
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
            <NoticeSkeleton count={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.3em] text-indigo-300">
                Notice Center
              </p>

              <h1 className="text-4xl font-bold">
                Smart Notice Board
              </h1>

              <p className="mt-3 text-slate-400">
                Search, filter, and manage
                notices in real-time.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Total",
                  value: notices.length,
                  color: "text-white",
                },
                {
                  label: "Unread",
                  value: unreadCount,
                  color: "text-emerald-400",
                },
                {
                  label: "Pinned",
                  value: notices.filter(
                    (n) => n.isPinned
                  ).length,
                  color: "text-yellow-400",
                },
                {
                  label: "High",
                  value: notices.filter(
                    (n) =>
                      n.priority === "high"
                  ).length,
                  color: "text-red-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 text-center"
                >
                  <p
                    className={`text-3xl font-bold ${stat.color}`}
                  >
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs uppercase tracking-widest text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="mb-6 flex justify-start">
          <div className="flex space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() =>
                setActiveTab("notices")
              }
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "notices"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active Notices
            </button>

            <button
              onClick={() =>
                setActiveTab("overview")
              }
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Activity Feed Overview
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === "overview" ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                Recent Notice Activity
              </h2>

              <span className="text-xs text-indigo-300 uppercase tracking-widest font-semibold bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Live Feed
              </span>
            </div>

            {derivedActivity?.length >
            0 ? (
              <div className="space-y-4">
                {derivedActivity.map(
                  (item, index) => (
                    <div
                      key={
                        item?.id || index
                      }
                      className="flex items-start justify-between bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {item?.title}
                        </p>

                        <p className="text-slate-400 text-xs mt-1">
                          By{" "}
                          <span className="text-slate-300 font-semibold">
                            {item?.user}
                          </span>{" "}
                          •{" "}
                          {getRelativeTime(
                            item?.timestamp
                          )}
                        </p>
                      </div>

                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {item?.type}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-500 text-base">
                  No recent activity
                  available
                </p>

                <p className="text-slate-600 text-xs mt-1">
                  Check back later for
                  system logs and notice
                  actions.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
            {/* Sidebar */}
            <aside className="space-y-6">
              <NoticeSearch
                value={searchQuery}
                onSearchChange={
                  setSearchQuery
                }
                onClearFilters={
                  handleClearFilters
                }
                resultsCount={
                  filteredNotices.length
                }
                activeFilterCount={
                  activeFilterCount
                }
                suggestions={
                  searchOptions
                }
                onSuggestionSelect={
                  handleSuggestionSelect
                }
              />

              <NoticeFilters
                categories={CATEGORIES}
                selectedCategory={
                  selectedCategory
                }
                onCategoryChange={
                  setSelectedCategory
                }
                selectedPriority={
                  selectedPriority
                }
                onPriorityChange={
                  setSelectedPriority
                }
                availableTags={
                  availableTags
                }
                selectedTags={
                  selectedTags
                }
                onTagToggle={
                  handleTagToggle
                }
                selectedDateRange={
                  dateRange
                }
                onDateRangeChange={
                  setDateRange
                }
                sortOrder={sortOrder}
                onSortOrderChange={
                  setSortOrder
                }
                showOnlyUnread={
                  showOnlyUnread
                }
                onToggleUnread={() =>
                  setShowOnlyUnread(
                    (prev) => !prev
                  )
                }
              />
            </aside>

            {/* Notices */}
            <main>
              {filteredNotices.length ===
              0 ? (
                <EmptyNoticeState
                  query={searchQuery}
                  onResetFilters={
                    handleClearFilters
                  }
                />
              ) : (
                <>
                  <motion.div
                    layout
                    className="grid gap-5 lg:grid-cols-2"
                  >
                    <AnimatePresence>
                      {paginatedNotices.map(
                        (notice) => {
                          const isRead =
                            readNotices.has(
                              notice.id
                            );

                          return (
                            <motion.div
                              key={
                                notice.id
                              }
                              layout
                              initial={{
                                opacity: 0,
                                y: 20,
                              }}
                              animate={{
                                opacity: 1,
                                y: 0,
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.95,
                              }}
                              transition={{
                                duration: 0.3,
                              }}
                            >
                              <NoticeCard
                                notice={
                                  notice
                                }
                                isRead={
                                  isRead
                                }
                                onToggleRead={() =>
                                  isRead
                                    ? markAsUnread(
                                        notice.id
                                      )
                                    : markAsRead(
                                        notice.id
                                      )
                                }
                                searchQuery={
                                  searchQuery
                                }
                                getRelativeTime={
                                  getRelativeTime
                                }
                              />
                            </motion.div>
                          );
                        }
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                      <p className="text-sm text-slate-400">
                        Showing{" "}
                        <span className="font-semibold text-white">
                          {indexOfFirstItem +
                            1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-white">
                          {Math.min(
                            indexOfLastItem,
                            filteredNotices.length
                          )}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-white">
                          {
                            filteredNotices.length
                          }
                        </span>{" "}
                        notices
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setCurrentPage(
                              (p) =>
                                Math.max(
                                  p - 1,
                                  1
                                )
                            )
                          }
                          disabled={
                            safeCurrentPage ===
                            1
                          }
                          className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium transition-all hover:bg-slate-800 disabled:opacity-40"
                        >
                          Previous
                        </button>

                        <button
                          onClick={() =>
                            setCurrentPage(
                              (p) =>
                                Math.min(
                                  p + 1,
                                  totalPages
                                )
                            )
                          }
                          disabled={
                            safeCurrentPage ===
                            totalPages
                          }
                          className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium transition-all hover:bg-slate-800 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartNoticeBoard;
