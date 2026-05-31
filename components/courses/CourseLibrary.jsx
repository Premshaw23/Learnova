"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Star, ArrowRight, BookOpen, Search, RotateCcw, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import Badge from "@/components/ui/Badge";

const getDifficultyVariant = (difficulty) => {
  const diff = difficulty?.toLowerCase();
  if (diff === "beginner") return "success";
  if (diff === "intermediate") return "warning";
  if (diff === "advanced") return "danger";
  return "indigo";
};

/**
 * CourseLibrary Component
 * Renders the course grid and handles client-side "Load More" pagination and data fetching.
 */
export default function CourseLibrary({
  initialCourses,
  initialHasMore,
  category,
  q,
  total,
  limit = 6,
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);

  // Sync state if initial courses change (e.g. search filter or category chip select re-fetches from server)
  useEffect(() => {
    setCourses(initialCourses);
    setPage(1);
    setHasMore(initialHasMore);
  }, [initialCourses, initialHasMore]);

  const loadMoreCourses = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/courses?q=${encodeURIComponent(q)}&category=${encodeURIComponent(
          category
        )}&page=${nextPage}&limit=${limit}`
      );
      const data = await res.json();

      if (data.success) {
        setCourses((prev) => [...prev, ...data.courses]);
        setPage(nextPage);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error("Failed to load more courses:", error);
      toast.error("Failed to load more courses. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Result Counter */}
      <div className="flex justify-end">
        <div className="text-sm font-medium text-slate-400 bg-slate-900/40 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-sm shadow-sm">
          Showing <span className="text-indigo-400 font-bold">{courses.length}</span> of{" "}
          <span className="text-white">{total}</span> courses
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="space-y-12">
          {/* Courses Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            <AnimatePresence mode="popLayout">
              {courses.map((course, index) => {
                const instructorInitials = course.instructor
                  .split(" ")
                  .filter((n) => n.length > 0)
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2);

                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                    className="group bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl relative overflow-hidden"
                  >
                    {/* Decorative glowing card accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-300" />

                    <div className="space-y-3 relative z-10">
                      {/* Course card banner with premium gradients */}
                      <div
                        className={`w-full h-40 bg-gradient-to-tr ${course.color} rounded-xl relative flex items-center justify-center p-6 text-center select-none shadow-inner group-hover:brightness-105 transition-all duration-300`}
                      >
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay rounded-xl" />
                        <BookOpen className="w-10 h-10 text-white/30 absolute left-4 bottom-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                        <span className="text-lg font-black text-white tracking-wider leading-snug drop-shadow-md">
                          {course.categoryLabel}
                        </span>
                      </div>

                      {/* Metadata chips */}
                      <div className="flex items-center gap-3 pt-1">
                        <Badge
                          variant={getDifficultyVariant(course.difficulty)}
                          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
                        >
                          {course.difficulty}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {course.duration.split(" • ")[0]}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400/90 font-bold ml-auto">
                          <Star className="w-3.5 h-3.5 fill-amber-400/80 text-transparent" />
                          {course.rating}
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1 leading-snug">
                        {course.title}
                      </h3>

                      {/* Course Description */}
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    {/* Card Bottom Section */}
                    <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-2 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md border border-slate-800">
                          {instructorInitials}
                        </div>
                        <span className="text-xs font-semibold text-slate-300 line-clamp-1 max-w-[120px]">
                          {course.instructor}
                        </span>
                      </div>

                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:text-white text-xs font-bold text-slate-300 transition-all duration-300 select-none group/btn shadow-md"
                      >
                        Explore
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all duration-200" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <button
                onClick={loadMoreCourses}
                disabled={isLoading}
                type="button"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-sm font-bold text-indigo-400 hover:bg-indigo-500 hover:text-white disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 cursor-pointer shadow-md select-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Loading Courses...</span>
                  </>
                ) : (
                  <span>Load More Courses</span>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-900/30 border border-slate-900 rounded-[2rem] backdrop-blur-sm max-w-3xl mx-auto shadow-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-6 shadow-md relative z-10">
            <Search className="w-8 h-8 text-slate-500 animate-pulse" />
          </div>

          <h3 className="text-xl font-bold text-slate-200 mb-2 relative z-10">
            No Courses Found
          </h3>

          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8 relative z-10">
            No courses matching your criteria. Try adjusting your search query, or clear your filters to explore our full selection of classes.
          </p>

          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 active:scale-95 transition-all duration-200 select-none relative z-10"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All Filters
          </Link>
        </div>
      )}
    </div>
  );
}
