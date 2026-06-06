"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { useAuth } from "@/hooks/useAuth";
import { useNotices } from "@/contexts/FirestoreContext";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
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
  // ── Modal State for Issue #2008 ──────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDescription, setNoticeDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, userProfile, loading: authLoading } = useAuth();

  const handleCreateNotice = async (e) => {
    if (e) e.preventDefault();
    if (!noticeTitle.trim() || !noticeDescription.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/notices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: noticeTitle.trim(),
          content: noticeDescription.trim(),
          category: "general",
          priority: "medium",
          isPinned: false,
          tags: [],
          targetAudience: ["student", "teacher", "parent"],
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        toast.success("Notice published successfully!");
        setIsCreateModalOpen(false);
        setNoticeTitle("");
        setNoticeDescription("");
      } else {
        toast.error(data.error || "Failed to publish notice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error publishing notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const [debouncedQuery, setDebouncedQuery] = useState("");
  // Debounced search for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [selectedPriority, setSelectedPriority] = useState("all");

  const [selectedTags, setSelectedTags] = useState([]);

  const [dateRange, setDateRange] = useState("all");

  const [sortOrder, setSortOrder] = useState("newest");

  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  const [readNotices, setReadNotices] = useState(new Set());

  const [activeTab, setActiveTab] = useState("notices");

  const [activity] = useState([]);

  const userId = user?.uid || user?.id || "anonymous";

  // State for paginated notices and metadata from backend
  const [loadedNotices, setLoadedNotices] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchOptions, setSearchOptions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pinned: 0,
    high: 0,
  });

  const readNoticesRef = useRef(readNotices);
  useEffect(() => {
    readNoticesRef.current = readNotices;
  }, [readNotices]);

  const fetchNotices = useCallback(async (pageToFetch, append = false) => {
    if (!user) return;
    setIsFetching(true);
    try {
      const token = await user.getIdToken();
      const queryParams = new URLSearchParams({
        page: pageToFetch,
        limit: 10,
        search: debouncedQuery,
        category: selectedCategory,
        priority: selectedPriority,
        tags: selectedTags.join(","),
        dateRange: dateRange,
        sort: sortOrder,
        unreadOnly: showOnlyUnread ? "true" : "false",
        readNotices: Array.from(readNoticesRef.current).join(","),
      });

      const response = await fetch(`/api/notices?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notices");
      }
      const result = await response.json();
      if (result.success) {
        const newNotices = result.data.notices.map((n) => ({
          ...n,
          createdAt: new Date(n.createdAt),
        }));

        if (append) {
          setLoadedNotices((prev) => [...prev, ...newNotices]);
        } else {
          setLoadedNotices(newNotices);
        }
        setTotalCount(result.data.totalCount);
        setTotalPages(result.data.totalPages);
        setHasMore(pageToFetch < result.data.totalPages);
        setAvailableTags(result.data.tags || []);
        setSearchOptions(result.data.suggestions || []);
        setStats(result.data.stats || { total: 0, unread: 0, pinned: 0, high: 0 });
        setFetchError(null);
      } else {
        toast.error(result.error || "Failed to fetch notices");
        setFetchError(result.error || "Failed to fetch notices");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching notices");
      setFetchError("Error fetching notices");
    } finally {
      setIsFetching(false);
    }
  }, [
    user,
    debouncedQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    sortOrder,
    showOnlyUnread,
  ]);

  // Trigger fetch when filters or user changes
  useEffect(() => {
    if (authLoading || !user) return;
    setPage(1);
    fetchNotices(1, false);
  }, [
    debouncedQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    sortOrder,
    showOnlyUnread,
    user,
    authLoading,
    fetchNotices,
  ]);

  // Derived activity from loaded notices
  const derivedActivity = useMemo(() => {
    if (activity?.length > 0) {
      return activity;
    }

    return (loadedNotices || []).slice(0, 5).map((notice, idx) => ({
      id: notice?.id || idx,
      title: notice?.title || "Untitled",
      timestamp: notice?.createdAt || new Date(),
      user: notice?.author || "System",
      type: notice?.isPinned
        ? "pin"
        : notice?.priority === "high"
          ? "urgent"
          : "create",
    }));
  }, [activity, loadedNotices]);

  const loading = authLoading || (isFetching && loadedNotices.length === 0);

  // Show toast once if fetching reports an error
  useEffect(() => {
    if (fetchError) {
      toast.error(fetchError);
    }
  }, [fetchError]);

  // Load read notices from user profile or local storage fallback
  useEffect(() => {
    if (!userId || userId === "anonymous") return;

    if (userProfile && Array.isArray(userProfile.readNotices)) {
      setReadNotices(new Set(userProfile.readNotices));
    } else {
      try {
        const saved = localStorage.getItem(`readNotices_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setReadNotices(new Set(parsed));
        }
      } catch (err) {
        console.error("Failed to load read notices locally:", err);
      }
    }
  }, [userId, userProfile]);

  // Save read state
  const saveReadState = useCallback(
    async (state) => {
      const stateArray = [...state];
      // Save locally as a fallback/cache
      try {
        localStorage.setItem(
          `readNotices_${userId}`,
          JSON.stringify(stateArray)
        );
      } catch (err) {
        console.error("Failed to save read state locally:", err);
      }

      // Sync to Firestore
      if (user && userId !== "anonymous") {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            readNotices: stateArray,
          });
        } catch (err) {
          console.error("Failed to sync read state to Firestore:", err);
        }
      }
    },
    [userId, user]
  );

  // Mark as read
  const markAsRead = useCallback(
    (noticeId) => {
      setReadNotices((current) => {
        const next = new Set(current);

        next.add(noticeId);

        saveReadState(next);

        // Optimistically update local stats and loaded list
        setStats((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
        if (showOnlyUnread) {
          setLoadedNotices((prev) => prev.filter((n) => n.id !== noticeId));
        }

        return next;
      });
    },
    [saveReadState, showOnlyUnread]
  );

  // Mark as unread
  const markAsUnread = useCallback(
    (noticeId) => {
      setReadNotices((current) => {
        const next = new Set(current);

        next.delete(noticeId);

        saveReadState(next);

        // Optimistically update local stats
        setStats((prev) => ({
          ...prev,
          unread: prev.unread + 1,
        }));

        return next;
      });
    },
    [saveReadState]
  );

  // Relative time
  const getRelativeTime = useCallback((date) => {
    const now = new Date();

    const diff = now.getTime() - new Date(date).getTime();

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return "Just now";
    }

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

  // Load More handler
  const handleLoadMore = useCallback(() => {
    if (isFetching || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotices(nextPage, true);
  }, [page, isFetching, hasMore, fetchNotices]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedTags([]);
    setDateRange("all");
    setSortOrder("newest");
    setShowOnlyUnread(false);
    setPage(1);
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
  const handleSuggestionSelect = useCallback((suggestion) => {
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

              <h1 className="text-4xl font-bold">Smart Notice Board</h1>

              <p className="mt-3 text-slate-400">
                Search, filter, and manage notices in real-time.
              </p>
            </div>
            {/* ── CREATE NOTICE BUTTON ────────── */}
            <div className="fixed bottom-8 right-8 text-black">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all"
              >
                + Create Notice
              </button>
            </div>

            {/* ── CREATE NOTICE MODAL (ISSUE #2008) ────────── */}
            <AnimatePresence>
              {isCreateModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-white"
                >
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4">
                    <h3 className="text-xl font-bold text-white">
                      Create New Notice
                    </h3>
                    <input
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    />

                    {/* DESCRIPTION TEXTAREA WITH CHARACTER COUNTER */}
                    <textarea
                      value={noticeDescription}
                      onChange={(e) => setNoticeDescription(e.target.value)}
                      maxLength={1000}
                      rows={5}
                      placeholder="Enter description..."
                      className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                    />
                    <div
                      className={`text-xs text-right ${noticeDescription.length > 900 ? "text-red-500" : "text-slate-500"}`}
                    >
                      {noticeDescription.length} / 1000
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsCreateModalOpen(false)}
                        disabled={isSubmitting}
                        className="text-slate-400 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateNotice}
                        disabled={isSubmitting}
                        className="bg-indigo-600 px-4 py-2 rounded-lg text-white disabled:opacity-50"
                      >
                        {isSubmitting ? "Posting..." : "Post"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                {
                  label: "Total",
                  value: stats.total,
                  color: "text-white",
                },
                {
                  label: "Unread",
                  value: stats.unread,
                  color: "text-emerald-400",
                },
                {
                  label: "Pinned",
                  value: stats.pinned,
                  color: "text-yellow-400",
                },
                {
                  label: "High",
                  value: stats.high,
                  color: "text-red-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 text-center"
                >
                  <p className={`text-3xl font-bold ${stat.color}`}>
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
              onClick={() => setActiveTab("notices")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === "notices"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Active Notices
            </button>

            <button
              onClick={() => setActiveTab("overview")}
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

            {derivedActivity?.length > 0 ? (
              <div className="space-y-4">
                {derivedActivity.map((item, index) => (
                  <div
                    key={item?.id || index}
                    className="flex items-start justify-between bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50"
                  >
                    <div>
                      <p className="text-white font-medium">{item?.title}</p>

                      <p className="text-slate-400 text-xs mt-1">
                        By{" "}
                        <span className="text-slate-300 font-semibold">
                          {item?.user}
                        </span>{" "}
                        • {getRelativeTime(item?.timestamp)}
                      </p>
                    </div>

                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {item?.type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
                <p className="text-slate-500 text-base">
                  No recent activity available
                </p>

                <p className="text-slate-600 text-xs mt-1">
                  Check back later for system logs and notice actions.
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
                onSearchChange={setSearchQuery}
                onClearFilters={handleClearFilters}
                resultsCount={totalCount}
                activeFilterCount={activeFilterCount}
                suggestions={searchOptions}
                onSuggestionSelect={handleSuggestionSelect}
              />

              <NoticeFilters
                categories={CATEGORIES}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedPriority={selectedPriority}
                onPriorityChange={setSelectedPriority}
                availableTags={availableTags}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                selectedDateRange={dateRange}
                onDateRangeChange={setDateRange}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                showOnlyUnread={showOnlyUnread}
                onToggleUnread={() => setShowOnlyUnread((prev) => !prev)}
              />
            </aside>

            {/* Notices */}
            <main>
              {loadedNotices.length === 0 ? (
                <EmptyNoticeState
                  query={searchQuery}
                  onResetFilters={handleClearFilters}
                />
              ) : (
                <>
                  <motion.div layout className="grid gap-5 lg:grid-cols-2">
                    <AnimatePresence>
                      {loadedNotices.map((notice) => {
                        const isRead = readNotices.has(notice.id);

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
                                  ? markAsUnread(notice.id)
                                  : markAsRead(notice.id)
                              }
                              searchQuery={searchQuery}
                              getRelativeTime={getRelativeTime}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination / Showing Status */}
                  <div className="mt-8 flex flex-col items-center justify-between border-t border-slate-800 pt-6 sm:flex-row gap-4">
                    <p className="text-sm text-slate-400">
                      Showing{" "}
                      <span className="font-semibold text-white">
                        {loadedNotices.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-white">
                        {totalCount}
                      </span>{" "}
                      notices
                    </p>

                    {hasMore && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleLoadMore}
                          disabled={isFetching}
                          className="rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-medium transition-all hover:bg-slate-800 disabled:opacity-40"
                        >
                          {isFetching ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </div>
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
