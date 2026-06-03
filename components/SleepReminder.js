"use client";

import { HeartHandshake, Moon, Coffee } from "lucide-react";

export default function SleepReminder() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Wellness
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
            Sleep Reminder
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Unplug at the right time and prime your mind for rest with a gentle
            sleep-friendly routine.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Moon className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Recharge
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Recommended rest
          </p>
          <p className="mt-4 text-lg font-semibold text-slate-950 dark:text-slate-100">
            7-9 hours
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Keep a steady bedtime and avoid screens at least 30 minutes before
            sleep for deeper rest.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Relaxation cues
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-3">
              <HeartHandshake className="mt-1 h-5 w-5 text-violet-500" />
              Set a calming evening ritual with light stretches and a short
              gratitude pause.
            </li>
            <li className="flex items-start gap-3">
              <Moon className="mt-1 h-5 w-5 text-violet-500" />
              Dim lights and quiet notifications to help your brain switch to
              rest mode.
            </li>
            <li className="flex items-start gap-3">
              <Coffee className="mt-1 h-5 w-5 text-slate-500" />
              Avoid caffeine later in the day and keep the bedroom cool for
              better sleep quality.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
