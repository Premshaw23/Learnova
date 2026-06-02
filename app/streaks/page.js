"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Calendar,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Plus,
  Zap,
  TrendingUp,
  Award,
  Info
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { normalizeStreakCount } from "@/lib/streakUtils";

export default function StreaksPage() {
  const [streak, setStreak] = useState(0);
  const [lastVisit, setLastVisit] = useState("");
  const [history, setHistory] = useState([]);
  const { user, userProfile } = useAuth();

  // Load and initialize data from Firestore or localStorage
  const loadStreakData = () => {
    if (typeof window === "undefined") return;

    try {
      let storedStreak = 0;
      let storedLastVisit = "";
      let storedHistory = [];

      if (userProfile) {
        storedStreak = normalizeStreakCount(userProfile.siteStreak);
        storedLastVisit = userProfile.siteLastVisit || "";
        storedHistory = userProfile.siteVisitHistory || [];
      } else {
        storedStreak = normalizeStreakCount(
          localStorage.getItem("learnova_site_streak"),
        );
        storedLastVisit = localStorage.getItem("learnova_site_last_visit") || "";
        try {
          const historyStr = localStorage.getItem("learnova_site_visit_history");
          storedHistory = historyStr ? JSON.parse(historyStr) : [];
        } catch (e) {
          storedHistory = [];
        }
      }

      setStreak(storedStreak);
      setLastVisit(storedLastVisit);
      setHistory(Array.isArray(storedHistory) ? storedHistory : []);
    } catch (error) {
      console.error("Error loading streak data:", error);
    }
  };

  useEffect(() => {
    loadStreakData();
  }, [userProfile]);

 
  const triggerToast = (msg) => {
    toast.success(msg);
  };

  // Helper: Get array of the last 7 calendar days (including today)
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      
      const offset = d.getTimezoneOffset();
      const localD = new Date(d.getTime() - (offset * 60 * 1000));
      const dateStr = localD.toISOString().split("T")[0];
      
      days.push({
        dateStr,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        dayNum: d.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  };

  // Simulator actions for user testing and demonstration
  const handleSimulateConsecutive = async () => {
    if (typeof window === "undefined") return;

    try {
      // Current simulation concept:
      // Let's pretend today was actually visited, and we're incrementing.
      // To simulate a consecutive day, we shift our dates so that we build a streak.
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const todayDateStr = localToday.toISOString().split("T")[0];

      // Shift the last visit date back by one day, so today counts as a consecutive visit
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const localYes = new Date(yesterday.getTime() - (offset * 60 * 1000));
      const yesterdayDateStr = localYes.toISOString().split("T")[0];

      let newStreak = streak + 1;
      let newHistory = [...history];

      // Ensure yesterday is in the history
      if (!newHistory.includes(yesterdayDateStr)) {
        newHistory.push(yesterdayDateStr);
      }
      // Ensure today is in the history
      if (!newHistory.includes(todayDateStr)) {
        newHistory.push(todayDateStr);
      }

      localStorage.setItem("learnova_site_streak", newStreak.toString());
      localStorage.setItem("learnova_site_last_visit", todayDateStr);
      localStorage.setItem("learnova_site_visit_history", JSON.stringify(newHistory));

      setStreak(newStreak);
      setLastVisit(todayDateStr);
      setHistory(newHistory);

      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          siteStreak: newStreak,
          siteLastVisit: todayDateStr,
          siteVisitHistory: newHistory,
        });
      }
      
      triggerToast(`🔥 Streak incremented to ${newStreak} days!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to increment streak. Please try again.");
    }
  };

  const handleSimulateFullWeek = async () => {
    if (typeof window === "undefined") return;

    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const historyList = [];

      // Generate dates for the last 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const localD = new Date(d.getTime() - (offset * 60 * 1000));
        const dateStr = localD.toISOString().split("T")[0];
        historyList.push(dateStr);
      }

      const todayDateStr = historyList[0]; // today

      localStorage.setItem("learnova_site_streak", "7");
      localStorage.setItem("learnova_site_last_visit", todayDateStr);
      localStorage.setItem("learnova_site_visit_history", JSON.stringify(historyList));

      setStreak(7);
      setLastVisit(todayDateStr);
      setHistory(historyList);

      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          siteStreak: 7,
          siteLastVisit: todayDateStr,
          siteVisitHistory: historyList,
        });
      }

      triggerToast("🎯 Simulated a full 7-day streak history!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to simulate full week. Please try again.");
    }
  };

  const handleResetStreak = async () => {
    if (typeof window === "undefined") return;

    try {
      const today = new Date();
      const offset = today.getTimezoneOffset();
      const localToday = new Date(today.getTime() - (offset * 60 * 1000));
      const todayDateStr = localToday.toISOString().split("T")[0];

      localStorage.setItem("learnova_site_streak", "1");
      localStorage.setItem("learnova_site_last_visit", todayDateStr);
      localStorage.setItem("learnova_site_visit_history", JSON.stringify([todayDateStr]));

      setStreak(1);
      setLastVisit(todayDateStr);
      setHistory([todayDateStr]);

      if (user?.uid) {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          siteStreak: 1,
          siteLastVisit: todayDateStr,
          siteVisitHistory: [todayDateStr],
        });
      }

      triggerToast("🔄 Streak reset to 1 day.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to reset streak. Please try again.");
    }
  };

  // Determine streak level tier and metadata
  const getStreakLevel = (count) => {
    if (count >= 30) return { title: "Supernova Blaze", badge: "🏆 Cosmic", desc: "Unstoppable consistency. You have achieved stellar discipline!", color: "from-pink-500 via-rose-500 to-amber-400" };
    if (count >= 14) return { title: "Solar Flare", badge: "⚡ Master", desc: "A blazing presence. You are dominating your learning routine!", color: "from-amber-500 via-orange-500 to-rose-500" };
    if (count >= 7) return { title: "Ember Spark", badge: "🔥 Expert", desc: "A solid full week of consistency. Keep the fire burning!", color: "from-purple-500 via-fuchsia-500 to-pink-500" };
    if (count >= 3) return { title: "Warm Glow", badge: "🌟 Pro", desc: "Starting to heat up! You're making consistency look easy.", color: "from-indigo-500 to-purple-500" };
    return { title: "Fresh Spark", badge: "🌱 Novice", desc: "Every massive fire starts with a tiny spark. Keep it up!", color: "from-cyan-500 to-indigo-500" };
  };

  const streakLevel = getStreakLevel(streak);
  const last7Days = getLast7Days();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.18),transparent_45%),linear-gradient(180deg,rgba(9,9,11,1),rgba(3,7,18,1))] text-slate-100 py-16 px-6 font-sans">
      
      {/* Background decoration matching footer's glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-pink-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-64 w-64 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Navigation / Header */}
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>
          
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 ring-1 ring-white/10">
              <Sparkles className="h-4 w-4 text-fuchsia-200" />
            </span>
            <span className="text-sm font-semibold tracking-wider text-fuchsia-200/90 uppercase">
              Consistency Lab
            </span>
          </div>
        </div>

        {/* Title Block */}
        <div className="mb-12 text-center space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-fuchsia-400">
            Learnova Streaks
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-base">
            Your streaks represent the consecutive days you have logged into Learnova. Keep learning daily to protect your flame!
          </p>
        </div>

        {/* Main Dashboard Section */}
        <div className="grid gap-8 md:grid-cols-3">
          
          {/* Flame Card - Grid Span 2 */}
          <div className="md:col-span-2 space-y-8">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
              {/* Card Gradient Glow overlay */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-2xl" />
              
              <div className="flex flex-col items-center justify-center py-6 text-center">
                {/* Pulsating Animated Flame SVG Container */}
                <motion.div
                  animate={{
                    scale: streak > 0 ? [1, 1.06, 1] : 1,
                    y: streak > 0 ? [0, -3, 0] : 0,
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative flex items-center justify-center mb-6 h-40 w-40 rounded-full bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 border border-white/5 ring-4 ring-purple-500/5 shadow-inner"
                >
                  {/* Glowing background behind flame */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500/20 via-rose-500/15 to-transparent opacity-60 blur-xl animate-pulse" />
                  
                  {/* Animated Flame */}
                  <motion.div
                    animate={streak > 0 ? {
                      filter: [
                        "drop-shadow(0px 0px 12px rgba(249,115,22,0.6))",
                        "drop-shadow(0px 0px 24px rgba(236,72,153,0.8))",
                        "drop-shadow(0px 0px 12px rgba(249,115,22,0.6))"
                      ]
                    } : {}}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Flame 
                      className={`h-24 w-24 ${
                        streak > 0 
                          ? "text-orange-500 fill-orange-500/90" 
                          : "text-slate-600 fill-slate-700/50"
                      }`} 
                    />
                  </motion.div>
                </motion.div>

                {/* Streak Counter */}
                <h2 className="text-6xl font-black tracking-tight text-white mb-2">
                  {streak}
                </h2>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400 font-bold mb-6">
                  {streak === 1 ? "Consecutive Day" : "Consecutive Days"}
                </p>

                {/* Tier Badge */}
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${streakLevel.color} text-white shadow-lg shadow-purple-950/30`}>
                  <Zap className="h-3.5 w-3.5" />
                  {streakLevel.badge}: {streakLevel.title}
                </span>

                <p className="mt-4 text-sm text-slate-300 max-w-sm">
                  {streakLevel.desc}
                </p>
              </div>
            </div>

            {/* Calendar Tracker Card */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-fuchsia-400" />
                  <h3 className="font-semibold text-white">Weekly Consistency</h3>
                </div>
                <span className="text-xs text-slate-400">Past 7 Days</span>
              </div>

              {/* Day Tracker Grid */}
              <div className="grid grid-cols-7 gap-3 pt-2">
                {last7Days.map((day) => {
                  const isActive = history.includes(day.dateStr);
                  return (
                    <div 
                      key={day.dateStr} 
                      className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                        isActive 
                          ? "bg-purple-950/20 border-purple-500/40 shadow-md shadow-purple-950/30" 
                          : "bg-white/5 border-white/5"
                      } ${day.isToday ? "ring-2 ring-cyan-500/50" : ""}`}
                    >
                      <span className="text-xs font-semibold text-slate-400 mb-2">
                        {day.label}
                      </span>
                      
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        isActive 
                          ? "bg-gradient-to-br from-orange-400 to-rose-500 text-white" 
                          : "bg-slate-800 text-slate-600"
                      }`}>
                        {isActive ? (
                          <Flame className="h-5 w-5 fill-current" />
                        ) : (
                          <span className="text-xs font-bold">{day.dayNum}</span>
                        )}
                      </div>
                      
                      {day.isToday && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-cyan-400 mt-2">
                          Today
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Stats / Simulator */}
          <div className="space-y-8">
            {/* Quick Stats Panel */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-400" />
                Streak Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-slate-400">Last Visited Date</span>
                  <span className="text-sm font-mono text-slate-200">
                    {lastVisit ? lastVisit : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-slate-400">Visit Count (30d)</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {history.length} / 30
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <span className="text-sm text-slate-400">Current Multiplier</span>
                  <span className="text-sm font-bold text-fuchsia-300">
                    {streak >= 30 ? "2.5x XP" : streak >= 14 ? "2.0x XP" : streak >= 7 ? "1.5x XP" : "1.0x XP"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Multiplier Status</span>
                  <span className="text-xs rounded-full bg-cyan-950/30 border border-cyan-800 text-cyan-300 px-2 py-0.5 font-semibold">
                    {streak >= 7 ? "Active" : "Locked"}
                  </span>
                </div>
              </div>
            </div>

            {/* Streak Simulator Card */}
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              {/* Highlight background element */}
              <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />
              
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-amber-400" />
                Streak Simulator
              </h3>
              <p className="text-xs text-slate-400 mb-5 leading-5">
                Use these developer simulator tools to easily test different streak levels, check-ins, or reset your progress.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleSimulateConsecutive}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-slate-950 px-4 py-2.5 text-sm font-bold transition-all hover:bg-slate-100 hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Simulate Next Visit Day
                </button>
                
                <button
                  onClick={handleSimulateFullWeek}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
                >
                  <Award className="h-4 w-4 text-purple-400" />
                  Set 7-Day Streak
                </button>

                <button
                  onClick={handleResetStreak}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/10 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Progress
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
