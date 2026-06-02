"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCcw } from "lucide-react";

const phases = [
  { key: "inhale", label: "Breathe In", duration: 4 },
  { key: "hold", label: "Hold", duration: 4 },
  { key: "exhale", label: "Breathe Out", duration: 6 },
];

export default function BreathingExercise() {
  const [activePhase, setActivePhase] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].duration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setActivePhase((prev) => {
            const next = (prev + 1) % phases.length;
            setSecondsLeft(phases[next].duration);
            return next;
          });
          return current;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isActive, activePhase]);

  useEffect(() => {
    setSecondsLeft(phases[activePhase].duration);
  }, [activePhase]);

  const currentPhase = phases[activePhase];

  const circleScale = useMemo(() => {
    if (currentPhase.key === "inhale") return 1.18;
    if (currentPhase.key === "hold") return 1.05;
    return 0.88;
  }, [currentPhase.key]);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Wellness</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">Breathing Exercise</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Practice a calm breathing cycle with guided pacing, gentle animation, and a focused countdown.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Activity className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Phase</p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{currentPhase.label}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] items-center">
        <div className="relative flex items-center justify-center rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-slate-100 via-white to-slate-100/90 dark:from-slate-900 dark:via-slate-950 to-slate-900/80 p-8 shadow-sm">
          <motion.div
            animate={{ scale: circleScale }}
            transition={{ duration: 2.4, ease: "easeInOut" }}
            className="flex h-52 w-52 items-center justify-center rounded-full border border-blue-300/30 bg-blue-500/10 shadow-[0_0_120px_rgba(14,165,233,0.1)] dark:border-blue-500/20 dark:bg-blue-500/5"
          >
            <div className="flex h-40 w-40 items-center justify-center rounded-full border border-slate-200/90 bg-white/80 text-center shadow-[inset_0_0_40px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-950/80">
              <div>
                <p className="text-5xl font-semibold text-slate-900 dark:text-slate-100">{secondsLeft}</p>
                <p className="mt-2 text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">seconds</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Guided rhythm</p>
            <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
              Follow the inhale-hold-exhale sequence to lower tension and refresh your focus. Repeat until you feel centered.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {phases.map((phase) => (
              <div key={phase.key} className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 p-4 text-center">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{phase.label}</p>
                <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-300">{phase.duration}s</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setIsActive((value) => !value)}
              className="rounded-3xl bg-slate-900 text-white px-4 py-3 font-semibold transition hover:bg-slate-800"
            >
              {isActive ? "Pause session" : "Start breathing"}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsActive(false);
                setActivePhase(0);
                setSecondsLeft(phases[0].duration);
              }}
              className="rounded-3xl border border-slate-200 bg-white text-slate-900 px-4 py-3 font-semibold transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
            >
              <RefreshCcw className="mr-2 inline h-4 w-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
