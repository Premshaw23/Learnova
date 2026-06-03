"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Feather, Sparkles, CheckCircle2 } from "lucide-react";

export default function DailyReflectionJournal() {
  const [wentWell, setWentWell] = useState("");
  const [proudOf, setProudOf] = useState("");
  const [saved, setSaved] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEntry = window.localStorage.getItem(
      "learnova-wellness-reflections"
    );
    if (savedEntry) {
      try {
        const parsed = JSON.parse(savedEntry);
        setWentWell(parsed.wentWell || "");
        setProudOf(parsed.proudOf || "");
      } catch (error) {
        setWentWell("");
        setProudOf("");
      }
    }
  }, []);

  const handleSave = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "learnova-wellness-reflections",
        JSON.stringify({
          wentWell,
          proudOf,
          updatedAt: new Date().toISOString(),
        })
      );
      setSaved(true);
      timeoutRef.current = window.setTimeout(() => setSaved(false), 2200);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950/80 via-violet-950/80 to-[#0f172a] shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8"
    >
      <div className="pointer-events-none absolute -left-16 top-10 h-44 w-44 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 p-6 shadow-inner shadow-slate-950/20">
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">
                Wellness
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Daily Reflection Journal
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Capture a calm moment of gratitude and recognize one proud
                achievement from today.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-violet-500/10 px-4 py-3 text-sm text-violet-100 ring-1 ring-violet-500/20">
              <Sparkles className="h-4 w-4" />
              Serenity check-in
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">
              <span className="font-semibold text-white">
                What went well today?
              </span>
              <textarea
                value={wentWell}
                onChange={({ target }) => setWentWell(target.value)}
                placeholder="A moment that felt good..."
                rows={4}
                className="min-h-[140px] rounded-3xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              />
            </label>

            <label className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">
              <span className="font-semibold text-white">
                One thing you’re proud of
              </span>
              <textarea
                value={proudOf}
                onChange={({ target }) => setProudOf(target.value)}
                placeholder="A small accomplishment or progress..."
                rows={4}
                className="min-h-[140px] rounded-3xl border border-slate-800 bg-slate-900/95 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400/20"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-violet-400/40"
            >
              <Feather className="h-4 w-4" /> Save reflection
            </button>
            <p className="text-sm text-slate-400">
              Your notes are stored locally for a quiet end-of-day review.
            </p>
          </div>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 inline-flex items-center gap-2 rounded-3xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100"
            >
              <CheckCircle2 className="h-4 w-4" /> Reflection saved
              successfully.
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
