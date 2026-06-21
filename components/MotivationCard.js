"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, HeartPulse, Lightbulb } from "lucide-react";

const quotes = [
  {
    id: 1,
    label: "Daily motivation",
    text: "A calm mind supports sharper thinking. Take small breaks and keep moving forward.",
    icon: Sparkles,
  },
  {
    id: 2,
    label: "Study encouragement",
    text: "Every step you take today builds stronger habits for tomorrow.",
    icon: BookOpen,
  },
  {
    id: 3,
    label: "Productivity reminder",
    text: "Focus on progress, not perfection. Momentum grows from consistency.",
    icon: Lightbulb,
  },
  {
    id: 4,
    label: "Wellness tip",
    text: "Hydrate often, breathe deeply, and let positive routines guide your day.",
    icon: HeartPulse,
  },
];

export default function MotivationCard() {
  const [index, setIndex] = useState(0);
  const current = quotes[index];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((value) => (value + 1) % quotes.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Motivation
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
            Daily Boost
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Enjoy a rotating wellness card with fresh encouragement, focus tips,
            and a calm visual mood.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Sparkles className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            New quote every few seconds
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -16 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-2xl shadow-slate-950/5 dark:border-slate-800/80 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900/80"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                <current.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
                  {current.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-100">
                  Wellness reminder
                </p>
              </div>
            </div>
            <p className="mt-6 text-lg leading-8 text-slate-700 dark:text-slate-300">
              {current.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
