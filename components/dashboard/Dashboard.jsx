import React, { useState, useEffect } from "react";
import SkeletonCard from "../ui/SkeletonCard";
import EmptyState from "../ui/EmptyState";

/**
 * Mock data representing courses / AI-generated content
 */
const MOCK_COURSES = [
  {
    id: 1,
    title: "Introduction to Next.js 14 & Server Actions",
    category: "Web Development",
    description: "Learn how to build production-ready applications with Next.js 14, routing, modern caching mechanisms, and server-side logic.",
    imageUrl: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
    author: {
      name: "Alex Johnson",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    },
    duration: "4h 30m",
  },
  {
    id: 2,
    title: "Mastering Tailwind CSS & Premium Animations",
    category: "Design & UI/UX",
    description: "Dive deep into utility-first CSS, custom animations, transitions, grid structures, and building responsive, glassmorphic layouts.",
    imageUrl: "bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600",
    author: {
      name: "Sarah Dev",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    },
    duration: "3h 15m",
  },
  {
    id: 3,
    title: "AI-Powered Development with Gemini API",
    category: "Artificial Intelligence",
    description: "Build next-generation intelligent applications using large language models, structured outputs, semantic search, and AI agents.",
    imageUrl: "bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-500",
    author: {
      name: "Marcus Chen",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    },
    duration: "5h 45m",
  },
];

/**
 * Example Dashboard Component
 * Demonstrates the transition between the:
 * 1. Loading State (renders 3 SkeletonCards)
 * 2. Empty State (renders the premium EmptyState component when no courses are present)
 * 3. Populated State (renders actual list data)
 */
const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' (populated) or 'empty' (simulated zero data)

  useEffect(() => {
    let timer;
    setIsLoading(true);
    if (activeTab === "all") {
      timer = setTimeout(() => {
        setCourses(MOCK_COURSES);
        setIsLoading(false);
      }, 1500);
    } else {
      timer = setTimeout(() => {
        setCourses([]);
        setIsLoading(false);
      }, 1500);
    }

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleEnrollFirstCourse = () => {
    setActiveTab("all");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Toggle between views to inspect the loading states and the empty states.
            </p>
          </div>
          
          {/* Controls to simulate states */}
          <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Simulate Courses
            </button>
            <button
              onClick={() => setActiveTab("empty")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "empty"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Simulate Empty State
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div>
          <h2 className="text-xl font-bold mb-6 text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span>My Enrolled Courses</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
              {isLoading ? "..." : courses.length}
            </span>
          </h2>

          {/* Conditional Rendering Logic:
              1. If isLoading is true, show 3 Skeleton Loading cards.
              2. If isLoading is false and data array is empty, show the custom EmptyState component.
              3. Otherwise, map and render the real data cards.
          */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <EmptyState
              title="No Courses Enrolled"
              description="It looks like you haven't enrolled in any courses yet. Enroll in a course or let our AI study planner generate a custom roadmap for you!"
              buttonText="Enroll in Your First Course"
              onAction={handleEnrollFirstCourse}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:shadow-md dark:hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Image Block */}
                    <div className={`w-full h-48 rounded-xl ${course.imageUrl} flex items-center justify-center overflow-hidden relative shadow-inner`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300" />
                      <svg className="w-12 h-12 text-white/40 drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>

                    {/* Content Area */}
                    <div className="space-y-2">
                      <span className="text-xs inline-block px-2.5 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {course.category}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Footer Area */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <img
                        src={course.author.avatar}
                        alt={course.author.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-100 dark:border-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {course.author.name}
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg font-medium">
                      {course.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
