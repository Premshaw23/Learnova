"use client";

import React, { useState, useEffect } from "react"; // removed useRef as it's not used
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  CheckCircle2, // removed XCircle as it's not used
  RotateCcw,
  Trophy,
  Play,
  Check,
  ChevronRight,
  AlertCircle, // removed Award as it's not used
  Bookmark,
  ListTodo,
} from "lucide-react";
import ShareButton from "@/components/ui/ShareButton";
import toast from "react-hot-toast";
import { db, isMockAuthMode, MOCK_USER } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { updateActivityProgress } from "@/services/activityService";
import { updateUserStat } from "@/services/statsService";
import { getQuizDataByTitle } from "@/constants/quizData";
import { useOfflineQuiz } from "@/hooks/useOfflineQuiz";
import { syncPendingQuizzes } from "@/services/offlineSyncService";


// Particle Confetti Shower component for passing scores
const Confetti = () => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: 80 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 250;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - (100 + Math.random() * 150);
      const colors = [
        "#ff007f",
        "#3b82f6",
        "#10b981",
        "#eab308",
        "#a855f7",
        "#ff5722",
      ];
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

export default function ActivityGame() {
  const params = useParams();
  const router = useRouter();
  const { user: realUser, loading: authLoading } = useAuth();

  // Development-only authentication bypass — requires explicit opt-in.
  // Set NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH=true in .env.local to enable.
  // Uses the centralized MOCK_USER from lib/firebaseConfig (single source of truth).
  // NEVER set the opt-in flag on staging, preview, or production deployments.
  const user = realUser || (isMockAuthMode ? MOCK_USER : null);

  const [mounted, setMounted] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz execution states
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [markedQuestions, setMarkedQuestions] = useState({});
  const [isReviewingSummary, setIsReviewingSummary] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState(0);
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);

  // Completion states
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasPassed, setHasPassed] = useState(false);
  const [finalScore, setFinalScore] = useState(null); // { correct, total, percentage }
  const [isPendingSync, setIsPendingSync] = useState(false);

  const { isOnline, saveProgress, loadProgress, clearProgress, savePendingSubmission } = useOfflineQuiz(params?.id);

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
            const title =
              params.id === "quantum-quiz"
                ? "Quantum Physics Quiz"
                : params.id === "geometry-quiz"
                  ? "Geometry Puzzle Master"
                  : "General Knowledge Quiz";
            setActivityData({
              id: params.id,
              title,
              type: "quiz",
              progress: 0,
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
          const title =
            params.id === "quantum-quiz"
              ? "Quantum Physics Quiz"
              : params.id === "geometry-quiz"
                ? "Geometry Puzzle Master"
                : "General Knowledge Quiz";
          setActivityData({
            id: params.id,
            title,
            type: "quiz",
            progress: 0,
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

  // Handle restoring offline progress
  useEffect(() => {
    if (quiz && !isStarted && !isCompleted) {
      const saved = loadProgress();
      if (saved && confirm("You have an unfinished quiz session. Do you want to resume?")) {
        setCurrentQuestionIdx(saved.currentQuestionIdx);
        setSelectedAnswers(saved.selectedAnswers);
        setTimeLeft(saved.timeLeft);
        setMarkedQuestions(saved.markedQuestions || {});
        setIsStarted(true);
      }
    }
  }, [quiz]);

  // Save progress dynamically
  useEffect(() => {
    if (isStarted && !isCompleted) {
      saveProgress({
        currentQuestionIdx,
        selectedAnswers,
        timeLeft,
        markedQuestions,
      });
    }
  }, [currentQuestionIdx, selectedAnswers, timeLeft, markedQuestions, isStarted, isCompleted]);

  // Sync when online
  useEffect(() => {
    if (isOnline) {
      syncPendingQuizzes().then(res => {
      .catch(err => console.error(err))