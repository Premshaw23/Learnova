"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle2, Trash2 } from "lucide-react";
import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";
import { normalizeDailyGoals } from "@/lib/wellnessStorage";

export default function DailyGoals() {
  const [goals, setGoals] = useState([]);
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedGoals = safeLocalStorageGet("learnova-wellness-goals", []);
    setGoals(normalizeDailyGoals(savedGoals));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    safeLocalStorageSet("learnova-wellness-goals", goals);
  }, [goals]);

  const addGoal = () => {
    const trimmed = goalInput.trim();
    if (!trimmed) return;
    setGoals((current) => [...current, { id: crypto.randomUUID(), text: trimmed, complete: false }]);
    setGoalInput("");
  };

  const toggleComplete = (id) => {
    setGoals((current) => current.map((goal) => (goal.id === id ? { ...goal, complete: !goal.complete } : goal)));
  };

  const removeGoal = (id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/85 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">Wellness</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-50">Daily Goals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Add simple wellness targets for the day and keep track of progress as goals are completed.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-4 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-6 w-6 text-slate-500 dark:text-slate-300" />
          <p className="mt-2 text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Build momentum</p>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={goalInput}
            onChange={(event) => setGoalInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addGoal();
            }}
            className="min-w-0 flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            placeholder="Add a wellness goal..."
            aria-label="Goal description"
          />
          <button
            type="button"
            onClick={addGoal}
            className="inline-flex items-center justify-center rounded-3xl bg-slate-900 text-white px-5 py-3 text-sm font-semibold transition hover:bg-slate-800"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Goal
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No goals added yet. Start with something small and calming.</p>
          ) : (
            goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between rounded-3xl border border-slate-200/80 bg-white/90 p-4 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100">
                <button
                  type="button"
                  onClick={() => toggleComplete(goal.id)}
                  className={`flex items-center gap-3 text-left ${goal.complete ? "opacity-70 line-through" : ""}`}
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {goal.text}
                </button>
                <button
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-500 transition hover:border-rose-400 hover:text-rose-500 dark:border-slate-800 dark:text-slate-400 dark:hover:text-rose-400"
                  aria-label={`Remove goal ${goal.text}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
