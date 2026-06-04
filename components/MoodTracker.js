"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smile, Headphones, Moon, AlertCircle, Wind } from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";
import { normalizeMoodHistory, normalizeMoodKey } from "@/lib/wellnessStorage";

const moodColors = {
  happy: "bright and energized",
  calm: "steady and centered",
  tired: "restful and slow",
  stressed: "tense and ready for reset",
  overwhelmed: "loaded and in need of space",
};

const moods = [
  {
    key: "happy",
    label: "Happy",
    emoji: "😄",
    icon: Smile,
    description: "A light, energized mood for study flow.",
    summary: "You’re feeling bright and focused — a great moment to build momentum.",
    detail: "Stay present and keep your energy steady with short breaks when needed.",
  },
  {
    key: "calm",
    label: "Calm",
    emoji: "😌",
    icon: Headphones,
    description: "Focused and steady without overload.",
    summary: "A calm focus supports thoughtful learning and steady progress.",
    detail: "Keep the pace gentle, and use this rhythm to deepen concentration.",
  },
  {
    key: "tired",
    label: "Tired",
    emoji: "😴",
    icon: Moon,
    description: "A restful mindset that needs a gentle pause.",
    summary: "Your body is asking for rest — a short break can restore clarity.",
    detail: "Pause, hydrate, or stretch before returning to study with fresh energy.",
  },
  {
    key: "stressed",
    label: "Stressed",
    emoji: "😟",
    icon: AlertCircle,
    description: "High tension. Time for a reset.",
    summary: "Stress is high right now — taking a moment can help bring balance.",
    detail: "Try breathing exercises or a quick walk to ease pressure.",
  },
  {
    key: "overwhelmed",
    label: "Overwhelmed",
    emoji: "😤",
    icon: Wind,
    description: "Too much on the plate. Step back and breathe.",
    summary: "There’s a lot going on — simplify your next step and move slowly.",
    detail: "Break tasks into smaller pieces and use your wellness tools to reset.",
  },
];

const moodKeys = moods.map((mood) => mood.key);

export default function MoodTracker() {
  const [activeMood, setActiveMood] = useState("happy");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedMood = safeLocalStorageGet("learnova-wellness-mood", "happy");
    const savedHistory = safeLocalStorageGet("learnova-wellness-mood-history", []);

    setActiveMood(normalizeMoodKey(savedMood, moodKeys));
    setHistory(normalizeMoodHistory(savedHistory, moodKeys));
  }, []);

  const handleMoodSelect = (key) => {
    const nextMood = normalizeMoodKey(key, moodKeys);
    const timestamp = new Date().toISOString();
    const nextHistory = [
      { key: nextMood, timestamp },
      ...normalizeMoodHistory(history, moodKeys),
    ].slice(0, 6);

    setActiveMood(nextMood);
    setHistory(nextHistory);
    if (typeof window !== "undefined") {
      safeLocalStorageSet("learnova-wellness-mood", nextMood);
      safeLocalStorageSet("learnova-wellness-mood-history", nextHistory);
    }
  };

  const selectedMood = moods.find((item) => item.key === activeMood) || moods[0];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/80 dark:bg-slate-950/70 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8 transition-colors duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Wellness</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">Mood Tracker</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Tap the mood that matches how you feel in this moment and keep a calm habit to check in regularly.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/70 dark:border-slate-800/70 bg-slate-50/80 dark:bg-slate-900/70 p-4 text-center shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Current Mood</p>
          <p className="mt-2 text-4xl">{selectedMood.emoji}</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedMood.label}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {moods.map((mood) => {
          const Icon = mood.icon;
          const isActive = mood.key === activeMood;
          return (
            <motion.button
              key={mood.key}
              type="button"
              onClick={() => handleMoodSelect(mood.key)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-400/50 ${
                isActive
                  ? "border-transparent bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-500 text-white shadow-[0_20px_80px_-50px_rgba(168,85,247,0.85)] ring-1 ring-white/10"
                  : "border-slate-200 bg-slate-950/80 text-slate-100 shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
              }`}

            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold">{mood.label}</p>
                  <p className="mt-2 text-sm text-slate-400 dark:text-slate-400">{mood.description}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive ? "bg-white/15 text-white ring-1 ring-white/20 shadow-[0_0_0_1px_rgba(255,255,255,0.14)] mt-6" : "bg-white/10 text-slate-100 border border-slate-800 dark:bg-slate-800/90 dark:border-slate-700"}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              {isActive && (
                <div className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-100 ring-1 ring-violet-500/30">
                  Selected mood
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto] items-start">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-5">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Mood summary</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedMood.summary}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {selectedMood.description} — keep nurturing this mood with soothing breaks and mindful studying.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-5 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Recent check-ins</p>
          <div className="mt-4 space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No mood history yet. Select a mood to record your first check-in.</p>
            ) : (
              history.map((entry) => {
                const mood = moods.find((item) => item.key === entry.key);
                return (
                  <div key={entry.timestamp} className="flex items-center justify-between rounded-2xl bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{mood?.label ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="text-xl">{mood?.emoji}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
