"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  CheckCircle,
  PlayCircle
} from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Mock course data matching params.id
  const course = {
    id: params.id || "nextjs-mastery",
    title: "Advanced Next.js & React Architecture",
    description: `Master **React Server Components (RSC)**, advanced rendering patterns (like *Partial Prerendering*), state management, and optimized deployment pipelines for modern web applications.

### Key Learning Objectives
- **Server/Client boundary** decoupling for performance.
- Dynamic caching configurations & middleware orchestration.
- Scale databases with pooling and high-performance querying.`,
    instructor: "Dr. Elena Rostova",
    duration: "12 hours • 24 lessons",
    difficulty: "Advanced",
    rating: "4.9 (1,240 ratings)",
    modules: [
      {
        title: "Module 1: React Server Components (RSC) Deep Dive",
        lessons: [
          { title: "Understanding the Server/Client Boundary", duration: "18 mins", completed: true },
          { title: "Data Fetching Patterns with Suspense", duration: "25 mins", completed: true },
          { title: "Streaming and Progressive Hydration", duration: "20 mins", completed: false }
        ]
      },
      {
        title: "Module 2: Advanced Routing & Rendering",
        lessons: [
          { title: "Parallel and Intercepted Routes", duration: "32 mins", completed: false },
          { title: "Dynamic Route Handlers & Middleware", duration: "15 mins", completed: false },
          { title: "On-demand Incremental Static Regeneration (ISR)", duration: "22 mins", completed: false }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white pb-16">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <ShareButton className="shadow-lg border-zinc-800/60" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 pt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Badge & Course Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {course.difficulty}
            </span>
            <span className="text-zinc-500">•</span>
            <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              {course.duration}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 mb-6 leading-tight">
            {course.title}
          </h1>

          <div className="mb-8 max-w-3xl">
            <MarkdownRenderer content={course.description} />
          </div>

          {/* Instructor & Action Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                {course.instructor.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Instructor</span>
                <span className="text-zinc-200 font-semibold">{course.instructor}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toast.success("Enrolling in course...")}
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-600/20 transition-all duration-200 select-none"
              >
                <PlayCircle className="w-5 h-5" />
                Start Learning
              </button>
            </div>
          </div>

          {/* Syllabus Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Syllabus Outline
            </h2>

            <div className="space-y-6">
              {course.modules.map((mod, idx) => (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 overflow-hidden transition-all duration-300 hover:border-zinc-700/50"
                >
                  <div className="px-6 py-4 bg-zinc-900/40 border-b border-zinc-800/50">
                    <h3 className="font-semibold text-zinc-200">{mod.title}</h3>
                  </div>
                  <div className="divide-y divide-zinc-800/30">
                    {mod.lessons.map((lesson, lIdx) => (
                      <div 
                        key={lIdx} 
                        className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-zinc-500 shrink-0" />
                          )}
                          <span className={`text-sm ${lesson.completed ? "text-zinc-400 line-through" : "text-zinc-300"}`}>
                            {lesson.title}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-900 px-2.5 py-1 rounded-md shrink-0">
                          {lesson.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
}
