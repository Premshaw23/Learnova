"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Play,
  Check,
  ChevronRight,
  AlertCircle,
  Award
} from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import toast from "react-hot-toast";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { updateActivityProgress } from "@/services/activityService";
import { updateUserStat } from "@/services/statsService";
import { getQuizDataByTitle } from "@/constants/quizData";

// Particle Confetti Shower component for passing scores
const Confetti = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 80 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 250;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - (100 + Math.random() * 150);
      const colors = ["#ff007f", "#3b82f6", "#10b981", "#eab308", "#a855f7", "#ff5722"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 8;
      const rotation = Math.random() * 360;
      return {
        id: i,
        x,
        y,
        color,
        size,
        rotation,
      };
    });
    setParticles(generated);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 150, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.3, 0.6],
            x: p.x,
            y: p.y,
            rotate: p.rotation + 720,
          }}
          transition={{
            duration: 1.8 + Math.random() * 1.2,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
};

const MOCK_USER = { uid: "mock-student-uid-947", email: "mock.student@learnova.edu" };

export default function ActivityGame() {
  const params = useParams();
  const router = useRouter();
  const { user: realUser, loading: authLoading } = useAuth();

  // Temporary local development-only authentication bypass for offline testing
  const isDev = process.env.NODE_ENV === "development";
  const user = realUser || (isDev ? MOCK_USER : null);

  const [mounted, setMounted] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz execution states
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

  // Completion states
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [finalScore, setFinalScore] = useState(null); // { correct, total, percentage }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth & redirect if needed
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      toast.error("Please log in to access activities.");
      router.push("/auth");
    }
  }, [user, authLoading, mounted, router]);

  // Fetch activity from Firestore & load corresponding quiz data
  useEffect(() => {
    if (!user?.uid || !params?.id) return;

    const fetchActivity = async () => {
      try {
        if (!db) {
          throw new Error("Firestore client SDK (db) is null or unconfigured.");
        }
        const docRef = doc(db, "activities", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setActivityData({ id: docSnap.id, ...data });

          const quizData = getQuizDataByTitle(data.title);
          setQuiz(quizData);
          setTimeLeft(quizData.timeLimit);
        } else {
          if (isDev) {
            // Fallback for custom dev ids (e.g. quantum-quiz, geometry-quiz)
            const title = params.id === "quantum-quiz"
              ? "Quantum Physics Quiz"
              : params.id === "geometry-quiz"
              ? "Geometry Puzzle Master"
              : "General Knowledge Quiz";
            setActivityData({
              id: params.id,
              title,
              type: "quiz",
              progress: 0
            });
            const quizData = getQuizDataByTitle(title);
            setQuiz(quizData);
            setTimeLeft(quizData.timeLimit);
          } else {
            toast.error("Activity details not found.");
          }
        }
      } catch (err) {
        console.error("Error loading activity:", err);
        if (isDev) {
          // Dev fallback for offline testing
          const title = params.id === "quantum-quiz"
            ? "Quantum Physics Quiz"
            : params.id === "geometry-quiz"
            ? "Geometry Puzzle Master"
            : "General Knowledge Quiz";
          setActivityData({
            id: params.id,
            title,
            type: "quiz",
            progress: 0
          });
          const quizData = getQuizDataByTitle(title);
          setQuiz(quizData);
          setTimeLeft(quizData.timeLimit);
        } else {
          toast.error("Failed to load activity details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user?.uid, params?.id, isDev]);

  // Handle active countdown timer when quiz is running
  useEffect(() => {
    if (!isStarted || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAutoSubmitTriggered(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isCompleted]);

  // Handle automatic submission on timeout
  useEffect(() => {
    if (autoSubmitTriggered) {
      toast.error("Time's up! Submitting your answers.");
      handleQuizSubmit();
      setAutoSubmitTriggered(false);
    }
  }, [autoSubmitTriggered]);

  if (!mounted) return null;

  // Show premium loading skeleton
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="max-w-2xl w-full space-y-6">
          <div className="h-8 bg-zinc-900 rounded-xl w-1/3 animate-pulse" />
          <div className="h-64 bg-zinc-900 rounded-2xl w-full border border-zinc-800/80 animate-pulse flex flex-col justify-between p-6">
            <div className="space-y-4">
              <div className="h-6 bg-zinc-800 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-zinc-800 rounded-lg w-1/2 animate-pulse" />
            </div>
            <div className="h-12 bg-zinc-800 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Handle cases where activity is not found
  if (!activityData || !quiz) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-md w-full text-center space-y-6 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-8 rounded-3xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold tracking-tight">Activity Not Found</h2>
          <p className="text-zinc-400">We could not load this learning activity. It may have been removed or doesn't exist.</p>
          <button
            onClick={() => router.push("/activity")}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-100 font-semibold border border-zinc-700/50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Activities
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIdx];
  const hasSelectedCurrent = selectedAnswers[currentQuestionIdx] !== undefined;

  // Format seconds into MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Submit and calculate score
  const handleQuizSubmit = async () => {
    if (isCompleted) return;

    let correctCount = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const totalCount = quiz.questions.length;
    const percentage = Math.round((correctCount / totalCount) * 100);
    const passed = percentage >= 60;

    setIsCompleted(true);
    setHasPassed(passed);
    setFinalScore({ correct: correctCount, total: totalCount, percentage });

    if (passed) {
      try {
        // Update database progress to 100%
        await updateActivityProgress(activityData.id, 100);
        // Increment the student's Assignments Done stat by 1
        await updateUserStat(user.uid, "Assignments Done", 1);
        toast.success("Outstanding job! Activity completed successfully.");
      } catch (err) {
        console.error("Failed to sync progress to database:", err);
        toast.error("Saved progress locally, but failed to sync online.");
      }
    } else {
      toast("Keep trying! Double check your answers and try again.", { icon: "💪" });
    }
  };

  const handleSelectOption = (optionIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIdx]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < quiz.questions.length - 1) {
      setDirection(1);
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      handleQuizSubmit();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setDirection(-1);
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setCurrentQuestionIdx(0);
    setIsCompleted(false);
    setHasPassed(false);
    setFinalScore(null);
    setTimeLeft(quiz.timeLimit);
    setIsStarted(true);
  };

  const currentProgressPercent = Math.round(((currentQuestionIdx + (hasSelectedCurrent ? 1 : 0)) / quiz.questions.length) * 100);

  // 1. Intro Screen
  if (!isStarted && !isCompleted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500 selection:text-white pb-16 relative overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/activity")}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
            type="button"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Activities
          </button>
          <ShareButton className="shadow-lg border-zinc-800/60" />
        </header>

        <main className="max-w-2xl mx-auto px-6 pt-16 relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              {quiz.category} • {quiz.level}
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-50 via-zinc-100 to-zinc-400 leading-tight">
                {activityData.title}
              </h1>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                Test your understanding and earn score milestones! Pass with a score of 60% or higher to complete the activity and advance your learning profile.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 p-6 rounded-2xl">
              <div className="text-center">
                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Questions</span>
                <span className="text-xl font-bold text-zinc-200">{quiz.questions.length} Qs</span>
              </div>
              <div className="text-center border-x border-zinc-800/50">
                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Time Limit</span>
                <span className="text-xl font-bold text-zinc-200">{quiz.timeLimit}s</span>
              </div>
              <div className="text-center">
                <span className="block text-zinc-500 text-xs uppercase tracking-wider font-semibold">Target</span>
                <span className="text-xl font-bold text-zinc-200">60% Pass</span>
              </div>
            </div>

            {activityData.progress >= 100 && (
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl text-green-400 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                You've already passed this activity!
              </div>
            )}

            <div>
              <button
                onClick={() => setIsStarted(true)}
                type="button"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all duration-200 group w-full sm:w-auto"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Quiz
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // 2. Completion Screen (Result Screen)
  if (isCompleted) {
    const isPassing = hasPassed;
    const progressText = isPassing ? "Activity Completed!" : "Quiz Failed";

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 relative overflow-hidden flex flex-col justify-between">
        {isPassing && <Confetti />}

        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/activity")}
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
            type="button"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Activities
          </button>
          <ShareButton className="shadow-lg border-zinc-800/60" />
        </header>

        <main className="max-w-xl mx-auto px-6 py-12 relative z-10 flex-grow flex flex-col items-center justify-center w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-8 md:p-10 rounded-3xl shadow-2xl text-center space-y-8"
          >
            {/* Header Icon */}
            <div className="flex justify-center">
              {isPassing ? (
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 blur-sm opacity-70 animate-pulse" />
                  <div className="relative w-20 h-20 rounded-full bg-zinc-800/80 flex items-center justify-center border border-zinc-700/80 text-yellow-400">
                    <Trophy className="w-10 h-10" />
                  </div>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                  <AlertCircle className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* Score & Progression */}
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight">
                {isPassing ? "Awesome Job!" : "Keep Learning!"}
              </h2>
              <p className="text-zinc-400 text-sm md:text-base">
                {isPassing
                  ? "You passed the quiz, earned points, and finalized this activity."
                  : "You need at least 60% score to successfully pass this activity."}
              </p>
            </div>

            {/* Stats Summary Cards */}
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-center items-center">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold block mb-1">Your Score</span>
                <span className={`text-3xl font-black ${isPassing ? "text-green-400" : "text-red-400"}`}>
                  {finalScore?.percentage}%
                </span>
                <span className="text-zinc-400 text-xs mt-1">
                  ({finalScore?.correct}/{finalScore?.total} Correct)
                </span>
              </div>

              <div className="bg-zinc-800/40 border border-zinc-800 p-4 rounded-2xl flex flex-col justify-center items-center">
                <span className="text-zinc-500 text-xs uppercase tracking-wider font-semibold block mb-1">XP Gained</span>
                <span className="text-3xl font-black text-indigo-400">
                  {isPassing ? "+100 XP" : "0 XP"}
                </span>
                <span className="text-zinc-400 text-xs mt-1">
                  {isPassing ? "Assignments Done +1" : "Try again to pass"}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleRetry}
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700/50 text-zinc-100 font-bold transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Quiz
              </button>

              <button
                onClick={() => router.push("/activity")}
                type="button"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 transition-all duration-200"
              >
                Continue Learning
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // 3. Active Quiz Runner
  const isTimeLow = timeLeft <= 15;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 relative overflow-hidden flex flex-col justify-between">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Info */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to exit the quiz? Current progress will not be saved.")) {
              router.push("/activity");
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors duration-200 group"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
          Exit Quiz
        </button>

        {/* Live Quiz Countdown Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-mono text-sm font-bold ${
          isTimeLow
            ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse scale-105"
            : "bg-zinc-900 border-zinc-800/80 text-zinc-300"
        }`}>
          <Clock className={`w-4 h-4 ${isTimeLow ? "text-red-400" : "text-zinc-500"}`} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main Runner Container */}
      <main className="max-w-2xl mx-auto px-6 py-10 relative z-10 flex-grow flex flex-col justify-center w-full">
        {/* Dynamic Progress indicator */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-zinc-400">
            <span>Progress: {currentProgressPercent}%</span>
            <span>Question {currentQuestionIdx + 1} of {quiz.questions.length}</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-900 border border-zinc-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentProgressPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Interactive Sliding Question Card */}
        <div className="relative overflow-hidden w-full">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestionIdx}
              custom={direction}
              variants={{
                enter: (dir) => ({
                  x: dir > 0 ? 150 : -150,
                  opacity: 0,
                  scale: 0.98,
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  scale: 1,
                },
                exit: (dir) => ({
                  x: dir < 0 ? 150 : -150,
                  opacity: 0,
                  scale: 0.98,
                }, { duration: 0.15 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 350, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="w-full bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 md:p-8 rounded-3xl shadow-xl space-y-6"
            >
              {/* Question text */}
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100 leading-snug">
                {currentQuestion.question}
              </h3>

              {/* Single-choice options list */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIdx] === idx;
                  const optionLetters = ["A", "B", "C", "D"];

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                        isSelected
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-200"
                          : "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700 text-zinc-300"
                      }`}
                      type="button"
                    >
                      {/* Letter marker tag */}
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors duration-200 ${
                        isSelected
                          ? "bg-indigo-500 text-white"
                          : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200"
                      }`}>
                        {optionLetters[idx] || idx + 1}
                      </span>
                      <span className="font-semibold text-sm md:text-base flex-grow leading-relaxed">
                        {option}
                      </span>

                      {/* Select check badge */}
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Step Controllers */}
        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIdx === 0}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 disabled:opacity-40 disabled:pointer-events-none font-semibold transition-all duration-200"
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!hasSelectedCurrent}
            type="button"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none active:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200"
          >
            {currentQuestionIdx === quiz.questions.length - 1 ? "Finish Quiz" : "Next Question"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </main>
    </div>
  );
}