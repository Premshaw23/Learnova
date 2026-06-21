"use client";

import { useEffect, useMemo, useState } from "react";
import { Droplet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";
import {
  DEFAULT_WATER_GLASSES,
  WELLNESS_WATER_GOAL,
  normalizeWaterGlasses,
} from "@/lib/wellnessStorage";

export default function WaterTracker() {
  const [glasses, setGlasses] = useState(DEFAULT_WATER_GLASSES);
  const goal = WELLNESS_WATER_GOAL;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedDate = safeLocalStorageGet("learnova-wellness-water-date", "");
    const today = new Date().toLocaleDateString();
    if (savedDate !== today) {
      safeLocalStorageSet("learnova-wellness-water", DEFAULT_WATER_GLASSES);
      safeLocalStorageSet("learnova-wellness-water-date", today);
      setGlasses(DEFAULT_WATER_GLASSES);
    } else {
      const saved = safeLocalStorageGet(
        "learnova-wellness-water",
        DEFAULT_WATER_GLASSES
      );
      setGlasses(normalizeWaterGlasses(saved, DEFAULT_WATER_GLASSES, goal));
    }
  }, [goal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const normalized = normalizeWaterGlasses(glasses, DEFAULT_WATER_GLASSES, goal);
    safeLocalStorageSet("learnova-wellness-water", normalized);

    // Also update today's snapshot so the timeline stays in sync
    const today = new Date().toISOString().split("T")[0];
    const snapshots = safeLocalStorageGet("learnova-wellness-snapshots", {});
    snapshots[today] = { ...(snapshots[today] || {}), water: normalized };
    safeLocalStorageSet("learnova-wellness-snapshots", snapshots);
    window.dispatchEvent(new Event("learnova-wellness-updated"));
  }, [glasses, goal]);

  const progress = useMemo(
    () => Math.min((glasses / goal) * 100, 100),
    [glasses, goal]
  );

  const addWater = () => {
    setGlasses((value) =>
      Math.min(
        normalizeWaterGlasses(value, DEFAULT_WATER_GLASSES, goal) + 1,
        goal
      )
    );
  };

  const removeWater = () => {
    setGlasses((value) =>
      Math.max(normalizeWaterGlasses(value, DEFAULT_WATER_GLASSES, goal) - 1, 0)
    );
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
            Wellness
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">
            Water Intake
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Track your hydration with a clear daily goal and simple water
            tracking controls.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <Droplet className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            Daily goal
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
            {goal}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">glasses</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              Water glasses
            </p>
            <p className="mt-2 text-4xl font-semibold text-slate-950 dark:text-slate-100">
              {glasses}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Target: {goal} glasses
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-3xl bg-white/90 px-4 py-3 text-slate-900 shadow-sm dark:bg-slate-950/90 dark:text-slate-100">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              <Droplet className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold">
              {Math.round(progress)}% hydrated
            </span>
          </div>
        </div>

        <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-violet-600 to-fuchsia-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={addWater}
            className="flex items-center justify-center gap-2 rounded-3xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold transition hover:bg-slate-800"
           aria-label="Add one glass of water">
            <ArrowUpRight className="h-4 w-4" /> Add Water
          </button>
          <button
            type="button"
            onClick={removeWater}
            className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
           aria-label="Remove one glass of water">
            <ArrowDownRight className="h-4 w-4" /> Remove Glass
          </button>
        </div>
      </div>
    </section>
  );
}
