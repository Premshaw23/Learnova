"use client";

import React, { useState, useEffect, useRef } from "react"; // Removed duplicate import of useParams and useRouter
import { useParams, useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowLeft,
  Clock,
  Sparkles,
  CheckCircle,
  PlayCircle,
  Users,
  Trash2,
  Award,
} from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import StudyDeck from "@/components/flashcards/StudyDeck";
import Breadcrumb from "@/components/ui/Breadcrumb";
import ReadingTimeBadge from "@/components/ui/ReadingTimeBadge";
import Tooltip from "@/components/ui/Tooltip";
import DailyQuoteCard from "@/components/ui/DailyQuoteCard";
import toast from "react-hot-toast";
import { routeParamSchema } from "@/lib/validations/auth";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { apiFetch } from "@/lib/apiClient";
import { addRecentActivity } from "@/utils/recentActivity";
import { useAuth } from "@/hooks/useAuth";
import { generateCertificatePDF } from "@/utils/pdf/generateCertificatePDF";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();

  const validationCheck = routeParamSchema.safeParse({ id: params.id });

  if (!validationCheck.success) {
    notFound();
  }

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
          {
            title: "Understanding the Server/Client Boundary",
            duration: "18 mins",
            completed: true,
          },
          {
            title: "Data Fetching Patterns with Suspense",
            duration: "25 mins",
            completed: true,
          },
          {
            title: "Streaming and Progressive Hydration",
            duration: "20 mins",
            completed: false,
          },
        ],
      },
      {
        title: "Module 2: Advanced Routing & Rendering",
        lessons: [
          {
            title: "Parallel and Intercepted Routes",
            duration: "32 mins",
            completed: false,
          },
          {
            title: "Dynamic Route Handlers & Middleware",
            duration: "15 mins",
            completed: false,
          },
          {
            title: "On-demand Incremental Static Regeneration (ISR)",
            duration: "22 mins",
            completed: false,
          },
        ],
      },
    ],
  };

  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [isPodActive, setIsPodActive] = useState(false);
  const [selectionText, setSelectionText] = useState("");
  const [selectionRect, setSelectionRect] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [originText, setOriginText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastProgress, setLastProgress] = useState(null);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");

  // --- Dynamic Completion & Certificate States ---
  const [completedLessons, setCompletedLessons] = useState({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completionDate, setCompletionDate] = useState("");
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // --- AI TIMELINE FEATURE STATES ---
  const videoRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTimestamps, setFilteredTimestamps] = useState([]);

  // Mock Data mimicking what an AI Video Intelligence API returns
  const mockVideoAIProperties = {
    duration: 300,
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    conceptMap: [
      { start: 0, end: 60, concept: "Introduction" },
      { start: 61, end: 180, concept: "Core Architecture" },
      { start: 181, end: 300, concept: "Advanced Optimization" },
    ],
    transcripts: [
      { start: 15, text: "Welcome to this lecture on server side processes." },
      {
        start: 75,
        text: "Let's dive deep into how backpropagation updates weights.",
      },
      {
        start: 120,
        text: "The chain rule is absolutely essential for understanding backpropagation.",
      },
      {
        start: 210,
        text: "Next, we will focus on progressive hydration patterns.",
      },
    ],
  };

  const containerRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    // Load progress from localStorage
    try {
      const saved = localStorage.getItem("learnova_continue_learning");
      if (saved) {
        const allProgress = JSON.parse(saved);
        if (allProgress[params.id]) {
          setLastProgress(allProgress[params.id]);
        }
      }

      // Load timestamp notes
      const savedNotes = localStorage.getItem(`video_notes_${params.id}`);
      if (savedNotes) {
        try {
          setNotes(JSON.parse(savedNotes));
        } catch (e) {
          console.error("Failed to parse notes", e);
        }
      }

      // Load completed lessons
      const savedCompleted = localStorage.getItem(
        `learnova_completed_lessons_${params.id}`
      );
      if (savedCompleted) {
        setCompletedLessons(JSON.parse(savedCompleted));
      } else {
        // Build initial completed lessons from the default mock structure
        const initialCompleted = {};
        course.modules.forEach((mod) => {
          mod.lessons.forEach((les) => {
            if (les.completed) {
              initialCompleted[les.title] = true;
            }
          });
        });
        setCompletedLessons(initialCompleted);
        localStorage.setItem(
          `learnova_completed_lessons_${params.id}`,
          JSON.stringify(initialCompleted)
        );
      }

      // Load stable completion date
      const savedDate = localStorage.getItem(
        `learnova_course_completed_date_${params.id}`
      );
      if (savedDate) {
        setCompletionDate(savedDate);
      }
    } catch (e) {
      console.error("Failed to load progress:", e);
    }
  }, []);

  // Update completion percentage and record date when hitting 100%
  useEffect(() => {
    if (!mounted) return;
    const totalLessons = course.modules.reduce(
      (sum, mod) => sum + mod.lessons.length,
      0
    );
    const completedCount = course.modules.reduce((sum, mod) => {
      return (
        sum + mod.lessons.filter((les) => completedLessons[les.title]).length
      );
    }, 0);
    const pct =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    setCompletionPercentage(pct);

    if (pct === 100) {
      let date = localStorage.getItem(
        `learnova_course_completed_date_${params.id}`
      );
      if (!date) {
        date = new Date().toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        localStorage.setItem(
          `learnova_course_completed_date_${params.id}`,
          date
        );
      }
      setCompletionDate(date);
    } else {
      localStorage.removeItem(`learnova_course_completed_date_${params.id}`);
      setCompletionDate("");
    }
  }, [completedLessons, mounted, params.id]);

  const toggleLesson = (lessonTitle) => {
    const next = {
      ...completedLessons,
      [lessonTitle]: !completedLessons[lessonTitle],
    };
    setCompletedLessons(next);
    try {
      localStorage.setItem(
        `learnova_completed_lessons_${params.id}`,
        JSON.stringify(next)
      );
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const saveProgress = (lesson, moduleTitle) => {
    const progressData = {
      lessonTitle: lesson.title,
      moduleTitle: moduleTitle,
      timestamp: Date.now(),
    };
    setLastProgress(progressData);

    try {
      const saved = localStorage.getItem("learnova_continue_learning");
      const allProgress = saved ? JSON.parse(saved) : {};
      allProgress[params.id] = progressData;
      localStorage.setItem(
        "learnova_continue_learning",
        JSON.stringify(allProgress)
      );
    } catch (e) {
      console.error(e);
    }
  };

  // Persist notes when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`video_notes_${params.id}`, JSON.stringify(notes));
    }
  }, [notes, mounted, params.id]);

  const toggleStudyPod = () => setIsPodActive(!isPodActive);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTimestamps([]);
      return;
    }
    const matches = mockVideoAIProperties.transcripts.filter((t) =>
      t.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTimestamps(matches);
  }, [searchQuery]);

  // Command the video player HTML element to jump to a specific time
  const handleSeek = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
      toast.success(
        `Jumped to ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
      );
    }
  };

  useEffect(() => {
    try {
      // Track this course view in recent activity
      addRecentActivity({
        id: `course_${course.id}`,
        title: course.title,
        type: "Course",
        path: `/courses/${course.id}`,
      });
    } catch (e) {
      // non-blocking
      console.error("failed to record recent activity", e);
    }
  }, [params.id]);

  if (!mounted) return null;

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
          <Tooltip content="Share this course" placement="bottom">
            <ShareButton className="shadow-lg border-zinc-800/60" />
          </Tooltip>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 pt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Breadcrumb Navigation */}
          <Breadcrumb
            paths={[
              { name: "Home", url: "/" },
              { name: "Courses", url: "/courses" },
              { name: course.title, url: `/courses/${course.id}` },
            ]}
          />

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
            <span className="text-zinc-500">•</span>
            <ReadingTimeBadge
              text={course.description}
              className="text-xs bg-zinc-900 border border-zinc-800/80 px-3 py-1 rounded-full text-zinc-400 hover:text-zinc-200 transition-all duration-200"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 mb-6 leading-tight">
            {course.title}
          </h1>

          {/* 💡 DAILY MOTIVATION 💡 */}
          <div className="mb-8">
            <DailyQuoteCard />
          </div>

          {/* 🎯 RESUME LEARNING BANNER 🎯 */}
          {lastProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-0.5">
                    Resume your last lesson
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100">
                    {lastProgress.lessonTitle}{" "}
                    <span className="text-zinc-500 font-normal ml-2">
                      in {lastProgress.moduleTitle}
                    </span>
                  </h3>
                </div>
              </div>
              <Tooltip
                content={`Jump back to: ${lastProgress.lessonTitle}`}
                placement="top"
              >
                <button
                  onClick={() =>
                    toast.success("Returning to your last spot...")
                  }
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Resume Learning
                </button>
              </Tooltip>
            </motion.div>
          )}

          {/* Debug Tools */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const next = {};
                course.modules.forEach((mod) => {
                  mod.lessons.forEach((les) => {
                    next[les.title] = true;
                  });
                });
                setCompletedLessons(next);
                localStorage.setItem(
                  `learnova_completed_lessons_${params.id}`,
                  JSON.stringify(next)
                );
                toast.success("Debug: All lessons marked complete!");
              }}
              className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              🚀 Auto-Complete Course
            </button>
            <button
              onClick={() => {
                setCompletedLessons({});
                localStorage.setItem(
                  `learnova_completed_lessons_${params.id}`,
                  JSON.stringify({})
                );
                localStorage.removeItem(
                  `learnova_course_completed_date_${params.id}`
                );
                setCompletionDate("");
                toast.success("Debug: Course progress reset!");
              }}
              className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-800 transition-all cursor-pointer active:scale-95"
            >
              🔄 Reset Progress
            </button>
          </div>

          {/* Progress Bar & Certificate Claim */}
          <div className="mb-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-300">
                Course Progress
              </span>
              <span className="text-sm font-bold text-indigo-400">
                {completionPercentage}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {/* If 100% complete, show certificate banner */}
            {completionPercentage === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-indigo-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Award className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      Certificate Unlocked!
                    </h4>
                    <p className="text-xs text-zinc-400">
                      You have completed all curriculum requirements for this
                      course.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  Claim Certificate
                </button>
              </motion.div>
            )}
          </div>

          {/* 2. Outer Layout Splitter Wrapper */}
          <div
            className={`flex flex-col ${isPodActive ? "lg:flex-row gap-6 items-start" : "w-full"}`}
          >
            {/* 3. Left Side Content Area */}
            <div
              className={`transition-all duration-300 ${isPodActive ? "w-full lg:flex-1" : "w-full"}`}
            >
              {/* 🌟 AI INTERACTIVE TIMELINE INTERFACE 🌟 */}
              <div className="my-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-xl">
                {/* The Video Stream */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-4">
                  <video
                    ref={videoRef}
                    src={mockVideoAIProperties.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Segmented AI Concept Map Progress Track */}
                <div className="mb-6">
                  <span className="text-xs font-semibold text-zinc-400 block mb-2 tracking-wider uppercase">
                    AI Concept Map Timeline
                  </span>
                  <div className="h-3 w-full bg-zinc-800 rounded-full flex overflow-hidden">
                    {mockVideoAIProperties.conceptMap.map((segment, index) => {
                      const segmentWidth =
                        ((segment.end - segment.start) /
                          mockVideoAIProperties.duration) *
                        100;
                      const trackColors = [
                        "bg-indigo-600/60",
                        "bg-purple-600/60",
                        "bg-pink-600/60",
                      ];
                      return (
                        <div
                          key={index}
                          style={{ width: `${segmentWidth}%` }}
                          className={`${trackColors[index % trackColors.length]} h-full border-r border-zinc-950/40 cursor-pointer transition-all hover:brightness-125`}
                          onClick={() => handleSeek(segment.start)}
                          title={`${segment.concept} (Click to jump)`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* User Search Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type a topic to scan video timeline (e.g., 'backpropagation')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Dropdown list of timestamps found by AI string filtering */}
                {filteredTimestamps.length > 0 && (
                  <div className="mt-3 bg-zinc-950 rounded-xl border border-zinc-800 p-3 space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-xs text-indigo-400 font-bold block px-1">
                      AI Matches Found:
                    </span>
                    {filteredTimestamps.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSeek(item.start)}
                        className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm"
                      >
                        <span className="text-indigo-400 font-mono font-semibold">
                          {Math.floor(item.start / 60)}:$
                          {String(item.start % 60).padStart(2, "0")}
                        </span>
                        <span className="text-zinc-300 line-clamp-1">
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* 📝 VIDEO TIMESTAMP NOTES SECTION 📝 */}
                <div className="mt-8 pt-6 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Personal Timestamp Notes
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded-full bg-zinc-800/50">
                      {notes.length} Total
                    </span>
                  </div>

                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      placeholder="Take a quick note at the current video time..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
                      className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shrink-0 shadow-lg shadow-indigo-600/10 active:scale-95"
                     aria-label="Action button">
                      Save Note
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className="group relative bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all cursor-pointer"
                          onClick={() => handleSeek(note.timestamp)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-4">
                              <span className="text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5 px-2 py-1 rounded bg-indigo-500/5 border border-indigo-500/10">
                                {note.formattedTime}
                              </span>
                              <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                {note.text}
                              </p>
                            </div>
                            <Tooltip content="Delete note" placement="top">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNote(note.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800/80">
                        <p className="text-sm text-zinc-500 italic">
                          No timestamp notes yet. Save a moment to revisit it
                          later.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8 max-w-3xl">
                <MarkdownRenderer content={course.description} />
              </div>

              {/* Instructor & Action Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                    {course.instructor
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">
                      Instructor
                    </span>
                    <span className="text-zinc-200 font-semibold">
                      {course.instructor}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <Tooltip
                    content={
                      isPodActive
                        ? "Hide collaboration panel"
                        : "Collaborate with others in real-time"
                    }
                    placement="bottom"
                  >
                    <button
                      onClick={toggleStudyPod}
                      type="button"
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-200 select-none border border-zinc-800 backdrop-blur-md ${
                        isPodActive
                          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-md"
                          : "bg-zinc-900/80 hover:bg-zinc-800 text-indigo-400 hover:text-indigo-300 shadow-lg"
                      }`}
                     aria-label="Action button">
                      <Users className="w-5 h-5" />
                      {isPodActive ? "Close Pod View" : "Start Study Pod"}
                    </button>
                  </Tooltip>
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
                        <h3 className="font-semibold text-zinc-200">
                          {mod.title}
                        </h3>
                      </div>
                      <div className="divide-y divide-zinc-800/30">
                        {mod.lessons.map((lesson, lIdx) => (
                          <div
                            key={lIdx}
                            onClick={() => {
                              saveProgress(lesson, mod.title);
                              toast.success(`Viewing: ${lesson.title}`);
                              if (!completedLessons[lesson.title]) {
                                toggleLesson(lesson.title);
                              }
                            }}
                            className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-zinc-900/30 transition-colors duration-150 cursor-pointer group/lesson"
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLesson(lesson.title);
                                }}
                                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-full cursor-pointer"
                              >
                                {completedLessons[lesson.title] ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-400 transition-colors shrink-0" />
                                ) : (
                                  <PlayCircle className="w-5 h-5 text-zinc-500 hover:text-zinc-400 transition-colors shrink-0" />
                                )}
                              </button>
                              <span
                                className={`text-sm transition-colors ${completedLessons[lesson.title] ? "text-zinc-400 line-through" : "text-zinc-300 group-hover/lesson:text-indigo-400"}`}
                              >
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
            </div>
            {/* 5. Right Side Collaborative Live Workspace Panel */}
            {isPodActive && (
              <div className="w-full lg:w-[400px] lg:sticky lg:top-24 border border-zinc-800 bg-zinc-900/60 rounded-2xl overflow-hidden h-[calc(100vh-140px)] flex flex-col backdrop-blur-md shadow-2xl z-20 p-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider text-zinc-300">
                      Live Study Pod Active
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPodActive(false)}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1 rounded"
                  >
                    Leave
                  </button>
                </div>

                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                  Active Members
                </p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg aspect-video flex items-center justify-center text-xs text-zinc-400">
                    You
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg aspect-video flex items-center justify-center text-xs text-zinc-500">
                    Classmate
                  </div>
                </div>

                <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">
                  Shared Notepad
                </p>
                <textarea
                  className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-300 resize-none focus:outline-none"
                  placeholder="Type shared notes here..."
                  defaultValue={`# Notes\n- Discussing Server Side processes\n- Reviewing architecture graphs`}
                />
              </div>
            )}
          </div>

          {/* Study / Flashcards */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100 mb-6">
              Study
            </h2>
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-4">
              <p className="text-zinc-400 mb-4">
                Select any text on this page to create a flashcard.
              </p>
              <StudyDeck />
            </div>
          </section>

          {/* Selection floating toolbar */}
          {selectionRect && !showCreate && (
            <div
              style={{
                position: "fixed",
                left: selectionRect.x + window.scrollX,
                top: selectionRect.y + window.scrollY - 40,
                zIndex: 60,
              }}
            >
              <button
                onClick={() => {
                  setFrontText(selectionText);
                  setBackText("");
                  setShowCreate(true);
                }}
                className="px-3 py-1 rounded-md bg-indigo-600 text-white shadow-lg"
              >
                Create Flashcard
              </button>
            </div>
          )}

          {/* Create flashcard panel */}
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-start justify-center pt-28">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-11/12 max-w-xl shadow-2xl">
                <h3 className="text-lg font-semibold mb-2">Create Flashcard</h3>
                <label className="text-xs text-zinc-400">
                  Front (selected text)
                </label>
                <textarea
                  value={frontText}
                  onChange={(e) => setFrontText(e.target.value)}
                  className="w-full rounded-md p-2 mb-3 bg-zinc-800 text-zinc-100"
                  rows={3}
                />
                <label className="text-xs text-zinc-400">Back (answer)</label>
                <textarea
                  value={backText}
                  onChange={(e) => setBackText(e.target.value)}
                  className="w-full rounded-md p-2 mb-4 bg-zinc-800 text-zinc-100"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setSelectionRect(null);
                      setSelectionText("");
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-700 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!frontText.trim() || !backText.trim()) {
                        toast.error("Both front and back are required");
                        return;
                      }
                      try {
                        setSubmitting(true);
                        const res = await apiFetch("/api/flashcards", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            front: frontText,
                            back: backText,
                            origin: originText,
                          }),
                        });
                        if (!res.ok) throw new Error("Failed");
                        const data = await res.json();
                        toast.success("Flashcard created");
                        setShowCreate(false);
                        setSelectionRect(null);
                        setSelectionText("");
                        setOriginText("");
                      } catch (e) {
                        console.error(e);
                        toast.error("Could not create flashcard");
                      } finally {
                        setSubmitting(false);
                      }
                    }}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Certificate Modal */}
          {showCertificateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fade-in">
              <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
                <button
                  onClick={() => setShowCertificateModal(false)}
                  className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Award className="text-amber-500 w-6 h-6" />
                  Your Course Certificate
                </h3>

                {/* Certificate Preview Box */}
                <div className="w-full aspect-[1.414/1] bg-slate-50 text-zinc-900 p-8 rounded-2xl shadow-inner border border-zinc-700 relative overflow-hidden flex flex-col justify-between select-none animate-scale-in">
                  {/* Gold borders */}
                  <div className="absolute inset-2 border-2 border-amber-500/60 pointer-events-none" />
                  <div className="absolute inset-3 border border-indigo-500/20 pointer-events-none" />

                  {/* Corner flourishes */}
                  <div
                    className="absolute top-2 left-2 w-4 h-4 bg-amber-500"
                    style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                  />
                  <div
                    className="absolute top-2 right-2 w-4 h-4 bg-amber-500"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%)" }}
                  />
                  <div
                    className="absolute bottom-2 left-2 w-4 h-4 bg-amber-500"
                    style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%)" }}
                  />
                  <div
                    className="absolute bottom-2 right-2 w-4 h-4 bg-amber-500"
                    style={{ clipPath: "polygon(100% 0, 0 100%, 100% 100%)" }}
                  />

                  {/* Branding */}
                  <div className="text-center pt-2">
                    <span className="text-[10px] font-black tracking-[0.3em] text-indigo-600 block">
                      LEARNOVA ACADEMY
                    </span>
                    <div className="w-12 h-0.5 bg-zinc-200 mx-auto mt-1" />
                  </div>

                  {/* Content */}
                  <div className="text-center my-auto space-y-4">
                    <p className="text-xs italic text-zinc-500 font-serif">
                      This certificate is proudly presented to
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-zinc-900 border-b border-amber-500/40 pb-1 max-w-md mx-auto leading-tight">
                      {user?.displayName ||
                        user?.email?.split("@")[0] ||
                        "Learnova Student"}
                    </h2>
                    <p className="text-xs italic text-zinc-500 font-serif">
                      for successfully completing the advanced curriculum and
                      requirements of
                    </p>
                    <h3 className="text-lg sm:text-xl font-bold text-indigo-700 tracking-wide">
                      {course.title}
                    </h3>
                    <p className="text-[11px] text-zinc-600">
                      Completed on{" "}
                      <span className="font-semibold">
                        {completionDate || new Date().toLocaleDateString()}
                      </span>
                    </p>
                  </div>

                  {/* Footer row */}
                  <div className="flex items-end justify-between px-4 pb-2">
                    {/* Left signature */}
                    <div className="text-center w-24">
                      <div className="font-serif italic text-xs text-indigo-600 h-6 flex items-center justify-center">
                        Elena Rostova
                      </div>
                      <div className="w-full h-px bg-zinc-300 my-0.5" />
                      <span className="text-[8px] font-bold text-zinc-400 block uppercase">
                        Instructor
                      </span>
                    </div>

                    {/* Central emblem */}
                    <div className="relative flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500 flex items-center justify-center text-amber-500 font-serif text-xs font-bold shadow-sm">
                        ★
                      </div>
                      <span className="text-[7px] font-bold text-amber-600 uppercase tracking-widest mt-1">
                        Validated
                      </span>
                    </div>

                    {/* Right signature */}
                    <div className="text-center w-24">
                      <div className="font-serif italic text-xs text-indigo-600 h-6 flex items-center justify-center">
                        Prem Shaw
                      </div>
                      <div className="w-full h-px bg-zinc-300 my-0.5" />
                      <span className="text-[8px] font-bold text-zinc-400 block uppercase">
                        Director
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const cleanTitle = course.title
                          .replace(/[^a-zA-Z]/g, "")
                          .substring(0, 3)
                          .toUpperCase();
                        const mockUrl = `${window.location.origin}/verify/certificate/LN-${cleanTitle}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                        navigator.clipboard.writeText(mockUrl);
                        toast.success("Certificate link copied to clipboard!");
                      }}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition cursor-pointer"
                    >
                      🔗 Copy Share Link
                    </button>
                    <button
                      onClick={() => {
                        const text = encodeURIComponent(
                          `I've just successfully completed "${course.title}" on Learnova! 🎓🚀`
                        );
                        window.open(
                          `https://twitter.com/intent/tweet?text=${text}`,
                          "_blank"
                        );
                        toast.success("Redirecting to X (Twitter)...");
                      }}
                      className="px-4 py-2.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Share on X
                    </button>
                    <button
                      onClick={() => {
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/`,
                          "_blank"
                        );
                        toast.success("Redirecting to LinkedIn...");
                      }}
                      className="px-4 py-2.5 bg-[#0A66C2] hover:bg-[#0956a2] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      Post to LinkedIn
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      try {
                        generateCertificatePDF({
                          studentName:
                            user?.displayName ||
                            user?.email?.split("@")[0] ||
                            "Learnova Student",
                          courseTitle: course.title,
                          completionDate:
                            completionDate || new Date().toLocaleDateString(),
                          instructorName:
                            course.instructor || "Learnova Faculty",
                        });
                        toast.success("Certificate PDF downloaded!");
                      } catch (e) {
                        console.error("PDF generation failed:", e);
                        toast.error(
                          "Could not generate PDF. Please try again."
                        );
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-5 h-5" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
