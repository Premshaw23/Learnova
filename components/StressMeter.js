"use client";

import { useEffect, useMemo, useState } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion } from "framer-motion";
import { Activity, Thermometer } from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";

export default function StressMeter() {
  const [stress, setStress] = useState(36);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedStress = safeLocalStorageGet("learnova-wellness-stress", 36);
    const normalizedStress = Math.min(
      100,
      Math.max(0, Number(savedStress) || 36)
    );
    setStress(normalizedStress);
    setIsHydrated(true);
  }, []);

  const handleStressChange = (value) => {
    const normalizedValue = Math.min(100, Math.max(0, Number(value) || 36));
    setStress(normalizedValue);
    if (typeof window !== "undefined") {
      safeLocalStorageSet("learnova-wellness-stress", normalizedValue);
    }
  };

  const level = useMemo(() => {
    if (stress < 35) return "Low Stress";
    if (stress < 70) return "Moderate Stress";
    return "High Stress";
  }, [stress]);

  const accent = useMemo(() => {
    if (stress < 35) return "#a78bfa";
    if (stress < 70) return "#7c3aed";
    return "#f97316";
  }, [stress]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Wellness
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
            Stress Meter
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Track your stress level with a responsive meter and calm your study
            flow when intensity climbs.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Activity className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            {level}
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
            {stress}%
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr] items-center">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
          <div className="w-48 mx-auto text-slate-950 dark:text-slate-50">
            <CircularProgressbar
              value={stress}
              text={`${stress}%`}
              strokeWidth={10}
              styles={buildStyles({
                pathColor: accent,
                textColor: "currentColor",
                textSize: "22px",
                trailColor: "rgba(148,163,184,0.2)",
                backgroundColor: "#0f172a",
              })}
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
            <label
              htmlFor="stress"
              className="block text-sm font-semibold text-slate-900 dark:text-slate-100"
            >
              Adjust stress level
            </label>
            <input
              id="stress"
              type="range"
              min="0"
              max="100"
              value={stress}
              onChange={(event) => handleStressChange(event.target.value)}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700 accent-violet-500"
            />
            <div className="mt-3 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Low</span>
              <span>Moderate</span>
              <span>High</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Wellness tip
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
              Try a short walk or breathing break when stress climbs above 70%.
              Gently shifting your rhythm helps keep learning comfortable.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-3 text-sm text-violet-200 dark:bg-violet-500/10 dark:text-violet-200">
              <Thermometer className="h-4 w-4" />
              Stay mindful and slow the pace.
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
