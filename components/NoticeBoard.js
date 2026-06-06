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

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all", label: "All Notices" },
  { id: "academic", label: "Academic" },
  { id: "administrative", label: "Administrative" },
  { id: "financial", label: "Financial" },
  { id: "general", label: "General" },
  { id: "technical", label: "Technical" },
];

const PRIORITY_OPTIONS = [
  { id: "all", label: "All Priorities" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

const DATE_RANGE_OPTIONS = [
  { id: "all", label: "All Time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
];

const ITEMS_PER_PAGE = 5;

const DEFAULT_NOTICE_PAYLOAD = {
  category: "general",
  priority: "medium",
  isPinned: false,
  tags: [],
  targetAudience: ["student", "teacher", "parent"],
};

// ─────────────────────────────────────────────────────────────────────────────
// Animation variants
// ─────────────────────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.15,
    },
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a Firestore Timestamp, a plain Date, or a string/number into a
 * native JS Date so downstream components can call .getTime() safely.
 */
const normaliseDate = (value) => {
  if (value instanceof Date) return value;
  if (value?.toDate) return value.toDate();
  return new Date(value || Date.now());
};

/**
 * Returns the number of active (non-default) filters so the UI can show a
 * badge count on the filter panel toggle.
 */
const countActiveFilters = ({
  selectedCategory,
  selectedPriority,
  selectedTags,
  dateRange,
  showOnlyUnread,
}) => {
  let count = 0;
  if (selectedCategory !== "all") count++;
  if (selectedPriority !== "all") count++;
  if (selectedTags.length > 0) count++;
  if (dateRange !== "all") count++;
  if (showOnlyUnread) count++;
  return count;
};

/**
 * Derives a simple activity feed from the raw notices list when no explicit
 * activity array is provided by the backend.
 */
const deriveActivityFromNotices = (notices) =>
  (notices || []).slice(0, 5).map((notice, idx) => ({
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

// ─────────────────────────────────────────────────────────────────────────────
// SmartNoticeBoard — main component
// ─────────────────────────────────────────────────────────────────────────────

const SmartNoticeBoard = () => {

  // ── Auth & Firestore data ──────────────────────────────────────────────
  const { user, userProfile, loading: authLoading } = useAuth();

  const {
    notices: rawNotices,
    loading: noticesLoading,
    error: noticesError,
  } = useNotices();

  // ── Modal state (Issue #2008) ──────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeDescription, setNoticeDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Search & filter state ──────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // ── Pagination state ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Read / unread state ────────────────────────────────────────────────
  const [readNotices, setReadNotices] = useState(new Set());

  // ── Tab state ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("notices");

  // ── Activity (reserved for a real activity-log endpoint) ──────────────
  const [activity] = useState([]);

  // ── Derived user identifier ────────────────────────────────────────────
  const userId = user?.uid || user?.id || "anonymous";

  // ─────────────────────────────────────────────────────────────────────────
  // Normalise raw Firestore notices
  // ─────────────────────────────────────────────────────────────────────────

  const notices = useMemo(
    () =>
      rawNotices.map((n) => ({
        ...n,
        createdAt: normaliseDate(n.createdAt),
      })),
    [rawNotices]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Activity feed
  // ─────────────────────────────────────────────────────────────────────────

  const derivedActivity = useMemo(() => {
    if (activity?.length > 0) return activity;
    return deriveActivityFromNotices(notices);
  }, [activity, notices]);

  // ─────────────────────────────────────────────────────────────────────────
  // Combined loading flag
  // ─────────────────────────────────────────────────────────────────────────

  const loading = authLoading || noticesLoading;

  // ─────────────────────────────────────────────────────────────────────────
  // Side effects
  // ─────────────────────────────────────────────────────────────────────────

  // Debounce the search query — avoids re-filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Surface a toast notification when the pool listener errors out
  useEffect(() => {
    if (noticesError) {
      toast.error("Failed to load notices");
    }
  }, [noticesError]);

  // Hydrate read-state from Firestore profile or localStorage fallback
  useEffect(() => {
    if (!userId || userId === "anonymous") return;

    if (userProfile && Array.isArray(userProfile.readNotices)) {
      setReadNotices(new Set(userProfile.readNotices));
      return;
    }

    try {
      const saved = localStorage.getItem(`readNotices_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setReadNotices(new Set(parsed));
        }
      }
    } catch (err) {
      console.error("Failed to load read notices locally:", err);
    }
  }, [userId, userProfile]);

  // Reset to page 1 whenever any filter / sort option changes
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

  // ─────────────────────────────────────────────────────────────────────────
  // Callbacks
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Persist the read-notice set to both localStorage and Firestore so state
   * survives page refreshes and syncs across devices.
   */
  const saveReadState = useCallback(
    async (state) => {
      const stateArray = [...state];

      // Always write to localStorage as a fast cache / offline fallback
      try {
        localStorage.setItem(
          `readNotices_${userId}`,
          JSON.stringify(stateArray)
        );
      } catch (err) {
        console.error("Failed to save read state locally:", err);
      }

      // Best-effort Firestore sync for authenticated users
      if (user && userId !== "anonymous") {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, { readNotices: stateArray });
        } catch (err) {
          console.error("Failed to sync read state to Firestore:", err);
        }
      }
    },
    [userId, user]
  );

  /** Mark a single notice as read and persist the updated set. */
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

  /** Mark a single notice as unread and persist the updated set. */
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

  /**
   * Toggle the pinned status of a notice (Issue #2011).
   * Fires a Firestore update in the background; the real-time listener handles
   * the optimistic UI update automatically.
   */
  const handleTogglePin = useCallback(
    async (noticeId, currentStatus) => {
      try {
        const noticeRef = doc(db, "notices", noticeId);
        await updateDoc(noticeRef, { isPinned: !currentStatus });
        toast.success(currentStatus ? "Notice unpinned" : "Notice pinned!");
      } catch (err) {
        console.error("Failed to toggle pin:", err);
        toast.error("Failed to update pin status. Reverting...");
      }
    },
    []
  );

  /**
   * Submit a new notice via the REST API (Issue #2008).
   * Wired to the floating create-notice modal.
   */
  const handleCreateNotice = useCallback(
    async (e) => {
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
            ...DEFAULT_NOTICE_PAYLOAD,
            title: noticeTitle.trim(),
            content: noticeDescription.trim(),
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
        console.error("handleCreateNotice error:", err);
        toast.error("Error publishing notice");
      } finally {
        setIsSubmitting(false);
      }
    },
    [noticeTitle, noticeDescription, user]
  );

  /** Reset every filter back to its default value. */
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedTags([]);
    setDateRange("all");
    setSortOrder("newest");
    setShowOnlyUnread(false);
    setCurrentPage(1);
  }, []);

  /** Toggle a tag in / out of the active tag-filter set. */
  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }, []);

  /** Populate the search box when the user selects an autocomplete suggestion. */
  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchQuery(suggestion);
  }, []);

  /**
   * Returns a human-readable relative-time string for any given Date value.
   * Examples: "Just now", "5m ago", "3h ago", "2d ago", "06/12/2025".
   */
  const getRelativeTime = useCallback((date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived / memoised values
  // ─────────────────────────────────────────────────────────────────────────

  /** Flat, deduplicated list of every tag across all notices. */
  const availableTags = useMemo(() => {
    const tags = notices.flatMap((notice) => notice?.tags || []);
    return [...new Set(tags)];
  }, [notices]);

  /** Notice titles used as autocomplete suggestions in the search input. */
  const searchOptions = useMemo(
    () => notices.map((notice) => notice?.title || ""),
    [notices]
  );

  /** Count of filters that differ from their defaults (drives the badge). */
  const activeFilterCount = useMemo(
    () =>
      countActiveFilters({
        selectedCategory,
        selectedPriority,
        selectedTags,
        dateRange,
        showOnlyUnread,
      }),
    [selectedCategory, selectedPriority, selectedTags, dateRange, showOnlyUnread]
  );

  /**
   * The fully filtered, sorted notice list.
   * Pinned notices always float to the top regardless of the chosen sort order.
   */
  const filteredNotices = useMemo(() => {
    const queryText = debouncedQuery.trim().toLowerCase();
    const now = Date.now();

    return notices
      .filter((notice) => {
        // Full-text search across title, content, category and tags
        const haystack = [
          notice?.title || "",
          notice?.content || "",
          notice?.category || "",
          ...(notice?.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        if (queryText && !haystack.includes(queryText)) return false;

        // Category filter
        if (
          selectedCategory !== "all" &&
          notice?.category !== selectedCategory
        ) {
          return false;
        }

        // Priority filter
        if (
          selectedPriority !== "all" &&
          notice?.priority !== selectedPriority
        ) {
          return false;
        }

        // Tags filter — notice must contain ALL selected tags
        if (
          selectedTags.length > 0 &&
          !selectedTags.every((tag) => notice?.tags?.includes(tag))
        ) {
          return false;
        }

        // Unread-only filter
        if (showOnlyUnread && readNotices.has(notice.id)) return false;

        // Date-range filter
        const noticeTime = new Date(notice?.createdAt).getTime();
        if (dateRange === "today") {
          return now - noticeTime <= 24 * 60 * 60 * 1000;
        }
        if (dateRange === "7d") {
          return now - noticeTime <= 7 * 24 * 60 * 60 * 1000;
        }
        if (dateRange === "30d") {
          return now - noticeTime <= 30 * 24 * 60 * 60 * 1000;
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned notices always sort to the top
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;

        // Secondary sort by date
        if (sortOrder === "oldest") {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [
    notices,
    debouncedQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    sortOrder,
    showOnlyUnread,
    readNotices,
  ]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filteredNotices.length / ITEMS_PER_PAGE);

  const safeCurrentPage =
    currentPage > totalPages && totalPages > 0 ? totalPages : currentPage;

  const indexOfLastItem = safeCurrentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;

  const paginatedNotices = filteredNotices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // ── Stats ────────────────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notices.filter((notice) => !readNotices.has(notice.id)).length,
    [notices, readNotices]
  );

  const pinnedCount = useMemo(
    () => notices.filter((n) => n.isPinned).length,
    [notices]
  );

  const highPriorityCount = useMemo(
    () => notices.filter((n) => n.priority === "high").length,
    [notices]
  );

  const statsConfig = useMemo(
    () => [
      { label: "Total", value: notices.length, color: "text-white" },
      { label: "Unread", value: unreadCount, color: "text-emerald-400" },
      { label: "Pinned", value: pinnedCount, color: "text-yellow-400" },
      { label: "High", value: highPriorityCount, color: "text-red-400" },
    ],
    [notices.length, unreadCount, pinnedCount, highPriorityCount]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Early return — loading skeleton
  // ─────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {/* Title block */}
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.3em] text-indigo-300">
                Notice Center
              </p>
              <h1 className="text-4xl font-bold">Smart Notice Board</h1>
              <p className="mt-3 text-slate-400">
                Search, filter, and manage notices in real-time.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {statsConfig.map((stat) => (
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

        {/* ── Floating Create Button ──────────────────────────────────────── */}
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-xl transition-all"
          >
            + Create Notice
          </button>
        </div>

        {/* ── Create Notice Modal (Issue #2008) ───────────────────────────── */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            >
              <motion.div
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4"
              >
                <h3 className="text-xl font-bold text-white">
                  Create New Notice
                </h3>

                {/* Title input */}
                <input
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />

                {/* Description textarea with character counter */}
                <div className="space-y-1">
                  <textarea
                    value={noticeDescription}
                    onChange={(e) => setNoticeDescription(e.target.value)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Enter description..."
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <div
                    className={`text-xs text-right ${
                      noticeDescription.length > 900
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {noticeDescription.length} / 1000
                  </div>
                </div>

                {/* Modal action buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNoticeTitle("");
                      setNoticeDescription("");
                    }}
                    disabled={isSubmitting}
                    className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotice}
                    disabled={isSubmitting}
                    className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2 rounded-lg text-white font-semibold disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Posting..." : "Post"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tab Bar ────────────────────────────────────────────────────── */}
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

        {/* ── Tab Content ────────────────────────────────────────────────── */}

        {activeTab === "overview" ? (

          /* ── Activity Feed tab ─────────────────────────────────────────── */
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

          /* ── Active Notices tab ────────────────────────────────────────── */
          <div className="grid gap-6 xl:grid-cols-[340px_1fr]">

            {/* Sidebar — search + filters */}
            <aside className="space-y-6">
              <NoticeSearch
                value={searchQuery}
                onSearchChange={setSearchQuery}
                onClearFilters={handleClearFilters}
                resultsCount={filteredNotices.length}
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

            {/* Main notice list */}
            <main>
              {filteredNotices.length === 0 ? (
                <EmptyNoticeState
                  query={searchQuery}
                  onResetFilters={handleClearFilters}
                />
              ) : (
                <>
                  {/* Animated card grid */}
                  <motion.div layout className="grid gap-5 lg:grid-cols-2">
                    <AnimatePresence>
                      {paginatedNotices.map((notice) => {
                        const isRead = readNotices.has(notice.id);

                        return (
                          <motion.div
                            key={notice.id}
                            layout
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <NoticeCard
                              notice={notice}
                              isRead={isRead}
                              onToggleRead={() =>
                                isRead
                                  ? markAsUnread(notice.id)
                                  : markAsRead(notice.id)
                              }
                              onTogglePin={() =>
                                handleTogglePin(notice.id, notice.isPinned)
                              }
                              searchQuery={searchQuery}
                              getRelativeTime={getRelativeTime}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
                      <p className="text-sm text-slate-400">
                        Showing{" "}
                        <span className="font-semibold text-white">
                          {indexOfFirstItem + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-semibold text-white">
                          {Math.min(indexOfLastItem, filteredNotices.length)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-white">
                          {filteredNotices.length}
                        </span>{" "}
                        notices
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(p - 1, 1))
                          }
                          disabled={safeCurrentPage === 1}
                          className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium transition-all hover:bg-slate-800 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(p + 1, totalPages))
                          }
                          disabled={safeCurrentPage === totalPages}
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