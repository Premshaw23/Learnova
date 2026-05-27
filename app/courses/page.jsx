import React from "react";
import Link from "next/link";
import { Sparkles, Clock, Star, ArrowRight, BookOpen, Search, RotateCcw } from "lucide-react";
import CourseFilters from "@/components/courses/CourseFilters";

// Master database of curated courses
const COURSES = [
  {
    id: "nextjs-mastery",
    title: "Advanced Next.js & React Architecture",
    description: "Master server components, advanced rendering patterns, state management, and optimized deployment pipelines for modern web applications.",
    instructor: "Dr. Elena Rostova",
    duration: "12 hours • 24 lessons",
    difficulty: "Advanced",
    rating: "4.9",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-blue-600 to-indigo-600",
  },
  {
    id: "python-data-science",
    title: "Python for Data Science & AI",
    description: "Dive deep into NumPy, Pandas, Scikit-Learn, and build robust machine learning models from scratch.",
    instructor: "Prof. Sarah Jenkins",
    duration: "18 hours • 36 lessons",
    difficulty: "Intermediate",
    rating: "4.8",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-teal-600 to-emerald-600",
  },
  {
    id: "ui-ux-design-fundamentals",
    title: "UI/UX Design Systems & Figma",
    description: "Learn to design premium user interfaces, establish styling tokens, and build complex component libraries in Figma.",
    instructor: "Marcus Aurelius",
    duration: "10 hours • 20 lessons",
    difficulty: "Beginner",
    rating: "4.7",
    category: "design",
    categoryLabel: "Design",
    color: "from-pink-600 to-purple-600",
  },
  {
    id: "fullstack-web-dev",
    title: "Modern Full-Stack Web Development",
    description: "Build scalable web applications using React, Node.js, Express, and MongoDB with modern authentication.",
    instructor: "Prem Shaw",
    duration: "25 hours • 50 lessons",
    difficulty: "Intermediate",
    rating: "5.0",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-violet-600 to-purple-600",
  },
  {
    id: "intro-machine-learning",
    title: "Introduction to Machine Learning",
    description: "Learn the foundational concepts of supervised and unsupervised learning, linear regression, and neural networks.",
    instructor: "Abir Ghosh",
    duration: "15 hours • 30 lessons",
    difficulty: "Intermediate",
    rating: "4.9",
    category: "data-science",
    categoryLabel: "Data Science",
    color: "from-cyan-600 to-blue-600",
  },
  {
    id: "mobile-app-dev-flutter",
    title: "Mobile App Development with Flutter",
    description: "Build high-performance, cross-platform mobile apps for iOS and Android using Flutter and Dart.",
    instructor: "Prashant Bhati",
    duration: "14 hours • 28 lessons",
    difficulty: "Intermediate",
    rating: "4.8",
    category: "web-dev",
    categoryLabel: "Web Dev",
    color: "from-amber-600 to-orange-600",
  }
];

export const metadata = {
  title: "Courses · Learnova",
  description: "Browse and manage your enrolled courses and curriculum",
  openGraph: {
    title: "Courses · Learnova",
    description: "Browse and manage your enrolled courses and curriculum",
    type: "website",
    siteName: "Learnova",
  },
  twitter: {
    card: "summary_large_image",
    title: "Courses · Learnova",
    description: "Browse and manage your enrolled courses and curriculum",
  },
};

export default async function CoursesPage({ searchParams }) {
  // Await searchParams to support Next.js 15 async routing boundaries while remaining backward compatible
  const resolvedParams = await searchParams;
  const q = resolvedParams?.q || "";
  const category = resolvedParams?.category || "all";

  // Filter courses based on robust search and category matching logic
  const filteredCourses = COURSES.filter((course) => {
    // 1. Search Query Match
    const matchesSearch = q
      ? course.title.toLowerCase().includes(q.toLowerCase()) ||
        course.description.toLowerCase().includes(q.toLowerCase()) ||
        course.instructor.toLowerCase().includes(q.toLowerCase())
      : true;

    // 2. Category Chip Match
    const matchesCategory =
      category === "all"
        ? true
        : course.category === category || 
          course.category.replace("-", "") === category ||
          category.includes(course.category);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20 pt-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Orbs */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/15 via-slate-950 to-slate-950 -z-10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[110px] pointer-events-none" />

      <main className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs font-bold text-indigo-400 uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            Knowledge Base
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400">
                Course Library
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
                Unlock your potential with our elite, premium courses. Learn advanced concepts directly from industry leads.
              </p>
            </div>
            
            <div className="text-sm font-medium text-slate-400 bg-slate-900/40 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-sm self-start md:self-auto shadow-sm">
              Showing <span className="text-indigo-400 font-bold">{filteredCourses.length}</span> of <span className="text-white">{COURSES.length}</span> courses
            </div>
          </div>
        </div>

        {/* Filter bar client component */}
        <div className="pt-2 border-t border-slate-900">
          <CourseFilters />
        </div>

        {/* Responsive Grid or Empty State */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredCourses.map((course) => {
              const instructorInitials = course.instructor
                .split(" ")
                .filter(n => n.length > 0)
                .map(n => n[0])
                .join("")
                .substring(0, 2);

              return (
                <div
                  key={course.id}
                  className="group bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between backdrop-blur-md hover:shadow-indigo-500/5 hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Decorative glowing card accent */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-300" />
                  
                  <div className="space-y-3 relative z-10">
                    {/* Course card banner with premium gradients */}
                    <div className={`w-full h-40 bg-gradient-to-tr ${course.color} rounded-xl relative flex items-center justify-center p-6 text-center select-none shadow-inner group-hover:brightness-105 transition-all duration-300`}>
                      <div className="absolute inset-0 bg-black/10 mix-blend-overlay rounded-xl" />
                      <BookOpen className="w-10 h-10 text-white/30 absolute left-4 bottom-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                      <span className="text-lg font-black text-white tracking-wider leading-snug drop-shadow-md">
                        {course.categoryLabel}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                        {course.difficulty}
                      </span>
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
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-850 hover:bg-slate-800 hover:border-slate-700 hover:text-white text-xs font-bold text-slate-300 transition-all duration-300 select-none group/btn shadow-md"
                    >
                      Explore
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all duration-200" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* High-Fidelity Beautiful Empty State */
          <div className="w-full flex flex-col items-center justify-center py-16 px-6 text-center bg-slate-900/30 border border-slate-900 rounded-[2rem] backdrop-blur-sm max-w-3xl mx-auto shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
            
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
      </main>
    </div>
  );
}
