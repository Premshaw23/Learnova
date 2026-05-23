"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "@/hooks/useAuth";
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

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const [readNotices, setReadNotices] = useState(new Set());

  const userId = user?.uid || user?.id || "anonymous";

  // Load notices + SSE
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      return;
    }

    if (!user) return;

    let eventSource;
    let reconnectTimeout;

    const connectSSE = () => {
      eventSource = new EventSource("/api/notices/stream");

      // Initial notices
      eventSource.addEventListener("initial", (e) => {
        try {
          const data = JSON.parse(e.data);

          const parsed = data.map((notice) => ({
            ...notice,
            createdAt: new Date(notice.createdAt),
          }));

          setNotices(parsed);
          setLoading(false);
        } catch (err) {
          console.error("Failed to parse initial notices:", err);
        }
      });

      // New notice
      eventSource.addEventListener("new-notice", (e) => {
        try {
          const notice = JSON.parse(e.data);

          const parsedNotice = {
            ...notice,
            createdAt: new Date(notice.createdAt),
          };

          setNotices((prev) => {
            const exists = prev.some(
              (item) => item.id === parsedNotice.id
            );

            if (exists) return prev;

            return [parsedNotice, ...prev];
          });

          if (parsedNotice.priority === "high") {
            toast(`High Priority: ${parsedNotice.title}`, {
              icon: "🚨",
              duration: 5000,
            });
          } else {
            toast.success(`New Notice: ${parsedNotice.title}`);
          }
        } catch (err) {
          console.error("Failed to parse new notice:", err);
        }
      });

      eventSource.onerror = () => {
        console.error("SSE disconnected. Reconnecting...");

        eventSource.close();

        reconnectTimeout = setTimeout(() => {
          connectSSE();
        }, 5000);
      };
    };

    connectSSE();

    // Load read notices
    try {
      const savedReadNotices = localStorage.getItem(
        `readNotices_${userId}`
      );

      if (savedReadNotices) {
        const parsed = JSON.parse(savedReadNotices);

        if (Array.isArray(parsed)) {
          setReadNotices(new Set(parsed));
        }
      }
    } catch (err) {
      console.error("Failed to load read notices:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [user, authLoading, userId]);

  // Save read state
  const saveReadState = useCallback(
    (state) => {
      try {
        localStorage.setItem(
          `readNotices_${userId}`,
          JSON.stringify([...state])
        );
      } catch (err) {
        console.error("Failed to save read state:", err);
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
  const getRelativeTime = useCallback((date) => {
    const now = new Date();

    const diff =
      now.getTime() - new Date(date).getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    return new Date(date).toLocaleDateString();
  }, []);

  // Available tags
  const availableTags = useMemo(() => {
    const tags = notices.flatMap(
      (notice) => notice.tags || []
    );

    return [...new Set(tags)];
  }, [notices]);

  // Suggestions
  const searchOptions = useMemo(() => {
    return notices.map((notice) => notice.title);
  }, [notices]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (selectedCategory !== "all") count++;
    if (selectedPriority !== "all") count++;
    if (selectedTags.length > 0) count++;
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

  // Filter notices
  const filteredNotices = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    const now = Date.now();

    return notices
      .filter((notice) => {
        // Search
        if (query) {
          const haystack =
            `
            ${notice.title}
            ${notice.content}
            ${notice.category}
            ${notice.tags?.join(" ")}
          `.toLowerCase();

          if (!haystack.includes(query)) {
            return false;
          }
        }

        // Category
        if (
          selectedCategory !== "all" &&
          notice.category !== selectedCategory
        ) {
          return false;
        }

        // Priority
        if (
          selectedPriority !== "all" &&
          notice.priority !== selectedPriority
        ) {
          return false;
        }

        // Tags
        if (
          selectedTags.length > 0 &&
          !selectedTags.every((tag) =>
            notice.tags?.includes(tag)
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
          notice.createdAt
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

        // Date sort
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

  // Unread count
  const unreadCount = useMemo(() => {
    return notices.filter(
      (notice) => !readNotices.has(notice.id)
    ).length;
  }, [notices, readNotices]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedTags([]);
    setDateRange("all");
    setSortOrder("newest");
    setShowOnlyUnread(false);
  }, []);

  // Toggle tags
  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }, []);

  // Suggestion select
  const handleSuggestionSelect = useCallback(
    (suggestion) => {
      setSearchQuery(suggestion);
    },
    []
  );

  // Loading
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
                Search, filter, and manage notices in
                real-time.
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
                    (n) => n.priority === "high"
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

        {/* Main */}
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-6">
            <NoticeSearch
              value={searchQuery}
              onSearchChange={setSearchQuery}
              onClearFilters={handleClearFilters}
              resultsCount={filteredNotices.length}
              activeFilterCount={activeFilterCount}
              suggestions={searchOptions}
              onSuggestionSelect={
                handleSuggestionSelect
              }
            />

            <NoticeFilters
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onCategoryChange={
                setSelectedCategory
              }
              selectedPriority={selectedPriority}
              onPriorityChange={
                setSelectedPriority
              }
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              selectedDateRange={dateRange}
              onDateRangeChange={setDateRange}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              showOnlyUnread={showOnlyUnread}
              onToggleUnread={() =>
                setShowOnlyUnread(
                  (prev) => !prev
                )
              }
            />
          </aside>

          {/* Notices */}
          <main>
            {filteredNotices.length === 0 ? (
              <EmptyNoticeState
                query={searchQuery}
                onResetFilters={
                  handleClearFilters
                }
              />
            ) : (
              <motion.div
                layout
                className="grid gap-5 lg:grid-cols-2"
              >
                <AnimatePresence>
                  {filteredNotices.map((notice) => {
                    const isRead =
                      readNotices.has(notice.id);

                    return (
                      <motion.div
                        key={notice.id}
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
                          notice={notice}
                          isRead={isRead}
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
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SmartNoticeBoard;