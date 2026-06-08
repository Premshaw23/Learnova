"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Play, Pause, RefreshCcw } from "lucide-react";
import { useIsMounted } from "@/hooks/useIsMounted";

const defaultDuration = 25 * 60;

export default function FocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(defaultDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem("learnova_focus_timer");
    if (saved) {
      try {
        const {
          isRunning: savedIsRunning,
          secondsLeft: savedSecondsLeft,
          lastUpdated,
        } = JSON.parse(saved);
        if (savedIsRunning && lastUpdated) {
          const elapsed = Math.floor((Date.now() - lastUpdated) / 1000);
          const remaining = savedSecondsLeft - elapsed;
          if (remaining > 0) {
            setSecondsLeft(remaining);
            setIsRunning(true);
          } else {
            setSecondsLeft(0);
            setIsRunning(false);
          }
        } else if (savedSecondsLeft !== undefined) {
          setSecondsLeft(savedSecondsLeft);
          setIsRunning(false);
        }
      } catch (e) {
        console.error("Failed to parse timer state");
      }
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    localStorage.setItem(
      "learnova_focus_timer",
      JSON.stringify({ isRunning, secondsLeft, lastUpdated: Date.now() })
    );
  }, [isRunning, secondsLeft, isClient]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const interval = window.setInterval(() => {
      if (!isMounted()) return;
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isRunning, isMounted]);

  const minutes = useMemo(
    () => String(Math.floor(secondsLeft / 60)).padStart(2, "0"),
    [secondsLeft]
  );
  const seconds = useMemo(
    () => String(secondsLeft % 60).padStart(2, "0"),
    [secondsLeft]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
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
            Focus Timer
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Use a Pomodoro-style countdown to keep your study sessions focused
            and intentional.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Clock className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Pomodoro mode
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-[1fr_auto] items-center">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-8 text-center shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Session timer
          </p>
          <p className="mt-4 text-[4rem] font-semibold text-slate-950 dark:text-slate-100 leading-none">
            {isClient ? minutes : "25"}
          </p>
          <p className="text-[4rem] font-semibold text-slate-950 dark:text-slate-100 leading-none">
            :{isClient ? seconds : "00"}
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setIsRunning((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
          >
            {isRunning ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(defaultDuration);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <RefreshCcw className="h-4 w-4" /> Reset
          </button>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Keep work chunks manageable. A strong rhythm builds resilience,
            focus, and calm energy.
          </p>
        </div>
      </div>
    </motion.section>
  );
}
