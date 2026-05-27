import React from "react";
import { Sparkles } from "lucide-react";
import CourseFilters from "@/components/courses/CourseFilters";
import CourseLibrary from "@/components/courses/CourseLibrary";
import { getPaginatedCourses } from "@/lib/courses";

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

  // Default limit 6 to demonstrate load-more pagination gracefully
  const limit = 6;
  const { courses, total, hasMore } = getPaginatedCourses({
    q,
    category,
    page: 1,
    limit,
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
          </div>
        </div>

        {/* Filter bar client component */}
        <div className="pt-2 border-t border-slate-900">
          <CourseFilters />
        </div>

        {/* Paginated Course Grid & Loading States */}
        <CourseLibrary
          initialCourses={courses}
          initialHasMore={hasMore}
          category={category}
          q={q}
          total={total}
          limit={limit}
        />
      </main>
    </div>
  );
}
