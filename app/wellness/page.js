"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import MoodTracker from "@/components/MoodTracker";
import StressMeter from "@/components/StressMeter";
import BreathingExercise from "@/components/BreathingExercise";
import MotivationCard from "@/components/MotivationCard";
import DailyGoals from "@/components/DailyGoals";
import SleepReminder from "@/components/SleepReminder";
import WaterTracker from "@/components/WaterTracker";
import DailyReflectionJournal from "@/components/DailyReflectionJournal";
import { HeartPulse } from "lucide-react";

export default function WellnessPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.24),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.18),transparent_30%),linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_100%)] text-slate-100 pt-28 pb-20 transition-colors duration-300 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <motion.div
              aria-hidden
              initial={{ x: 0, y: 0, opacity: 0.85 }}
              animate={{ x: [0, -36, 0], y: [0, 8, 0], opacity: [0.85, 0.7, 0.85] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -inset-12 rounded-2xl blur-3xl mix-blend-screen"
              style={{
                background:
                  'radial-gradient(600px 400px at 75% 30%, rgba(124,58,237,0.42), rgba(79,70,229,0.25) 30%, transparent 60%), radial-gradient(400px 300px at 20% 80%, rgba(99,102,241,0.12), transparent 40%)'
              }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10 rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl text-slate-100"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 shadow-sm shadow-violet-500/10">
                  <HeartPulse className="h-4 w-4 text-violet-200" /> Wellness & Mental Health
                </div>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  A calming digital wellbeing dashboard for balanced focus.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                  Track your mood, manage stress, hydrate with ease, and use gentle breathing exercises to keep learning energized and relaxed.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/30 sm:p-6">
                <p className="text-sm uppercase tracking-[0.45em] text-slate-400">Journal Goals</p>
                <p className="mt-4 text-3xl font-semibold text-white">Daily writing focus</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Set a gentle reflection intention and keep your journal habit connected to wellbeing.</p>
                <div className="mt-5 space-y-3">
                  <div className="rounded-3xl bg-white/5 p-4 text-left text-sm text-slate-100 ring-1 ring-white/10">
                    <p className="font-semibold text-white">1. Capture one win</p>
                    <p className="mt-1 text-slate-400">Record a positive moment from today.</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4 text-left text-sm text-slate-100 ring-1 ring-white/10">
                    <p className="font-semibold text-white">2. Note a proud progress</p>
                    <p className="mt-1 text-slate-400">Celebrate your effort, however small.</p>
                  </div>
                  <div className="rounded-3xl bg-white/5 p-4 text-left text-sm text-slate-100 ring-1 ring-white/10">
                    <p className="font-semibold text-white">3. Keep the habit</p>
                    <p className="mt-1 text-slate-400">Return tomorrow with a fresh note.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-6">
              <MoodTracker />
              <StressMeter />
              <BreathingExercise />
              <MotivationCard />
            </div>
            <div className="space-y-6">
              <DailyReflectionJournal />
              <DailyGoals />
              <SleepReminder />
              <WaterTracker />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
