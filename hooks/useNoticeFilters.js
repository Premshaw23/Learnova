"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Custom hook for managing notice search and filter state
 * Provides optimized state management with memoized computations
 * 
 * @param {Array} notices - Array of notice objects to filter
 * @returns {Object} Filter state and handlers
 */
export const useNoticeFilters = (notices) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Calculate active filter count
  const activeFilterCount = useMemo(
    () =>
      [
        selectedCategory !== "all",
        selectedPriority !== "all",
        selectedTags.length > 0,
        dateRange !== "all",
        showOnlyUnread,
      ].filter(Boolean).length,
    [selectedCategory, selectedPriority, selectedTags, dateRange, showOnlyUnread]
  );

  // Extract available tags from notices
  const availableTags = useMemo(
    () => Array.from(new Set(notices.flatMap((notice) => notice.tags || []))).sort(),
    [notices]
  );

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    const suggestions = new Set();
    notices.forEach((notice) => {
      suggestions.add(notice.title);
      suggestions.add(notice.category);
      if (notice.tags) {
        notice.tags.forEach((tag) => suggestions.add(tag));
      }
    });
    return Array.from(suggestions).sort();
  }, [notices]);

  // Toggle tag selection
  const handleTagToggle = useCallback((tag) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }, []);

  // Reset all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedPriority("all");
    setSelectedTags([]);
    setDateRange("all");
    setSortOrder("newest");
    setShowOnlyUnread(false);
  }, []);

  return {
    // State
    searchQuery,
    selectedCategory,
    selectedPriority,
    selectedTags,
    dateRange,
    sortOrder,
    showOnlyUnread,
    
    // Computed values
    activeFilterCount,
    availableTags,
    searchSuggestions,
    
    // Setters
    setSearchQuery,
    setSelectedCategory,
    setSelectedPriority,
    setSelectedTags,
    setDateRange,
    setSortOrder,
    setShowOnlyUnread,
    
    // Handlers
    handleTagToggle,
    handleClearFilters,
  };
};

export default useNoticeFilters;
