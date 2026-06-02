"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statuses = ["productive", "lowEnergy", "stressSpike"];
const statusMeta = {
  productive: {
    label: "Productive",
    description: "Strong energy and focus",
    classes: "bg-violet-400/90 ring-violet-400/20",
  },
  lowEnergy: {
    label: "Low energy",
    description: "Gentle momentum",
    classes: "bg-slate-600/90 ring-slate-600/20",
  },
  stressSpike: {
    label: "Stress spike",
    description: "Needs a reset",
    classes: "bg-fuchsia-500/90 ring-fuchsia-500/20",
  },
};

function formatHeatmapDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function buildHeatmapData() {
  const end = new Date();
  const weeks = 6;
  const daysPerWeek = 7;
  const data = [];
  const start = new Date(end);
  start.setDate(end.getDate() - weeks * daysPerWeek + 1);

  for (let week = 0; week < weeks; week += 1) {
    const weekData = [];
    for (let day = 0; day < daysPerWeek; day += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + week * daysPerWeek + day);
      const randomValue = Math.random();
      const status = randomValue < 0.55 ? "productive" : randomValue < 0.85 ? "lowEnergy" : "stressSpike";
      weekData.push({
        date: date.toISOString(),
        label: formatHeatmapDate(date),
        status,
      });
    }
    data.push(weekData);
  }

  return data;
}

export default function StudyEnergyHeatmap() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setHeatmapData(buildHeatmapData());
  }, []);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/10 dark:bg-slate-950/80 dark:border-slate-700 shadow-2xl shadow-slate-950/20 backdrop-blur-xl p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Wellness</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Study Energy Heatmap</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
            Track weekly productivity patterns with dynamic energy states and a quick status overview.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 px-4 py-3 text-center text-sm text-slate-300 shadow-sm">
          <div className="flex items-center justify-center gap-2 text-violet-200">
            <Sparkles className="h-4 w-4" />
            Recent energy trends
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60 p-5 shadow-inner shadow-slate-950/30">
        <div className="grid grid-cols-[auto_1fr] gap-4 md:grid-cols-[auto_1fr]">
          <div className="space-y-2">
            {dayNames.map((day) => (
              <div key={day} className="text-xs uppercase tracking-[0.35em] text-slate-500">{day}</div>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(129,140,248,0.16),_transparent_20%)]" />
            <div className="relative z-10 grid grid-flow-col gap-3">
              {heatmapData.map((week, weekIndex) => (
                <div key={`week-${weekIndex}`} className="grid gap-3">
                  {week.map((cell, dayIndex) => {
                    const meta = statusMeta[cell.status];
                    return (
                      <button
                        key={`cell-${weekIndex}-${dayIndex}`}
                        type="button"
                        onMouseEnter={() => setHovered({ ...cell, weekIndex, dayIndex })}
                        onMouseLeave={() => setHovered(null)}
                        className={`h-10 w-10 rounded-2xl border border-white/10 transition-transform duration-200 hover:scale-105 ${meta.classes}`}
                        aria-label={`${dayNames[dayIndex]} ${cell.label}: ${meta.label}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-none absolute right-4 top-4 z-20 rounded-3xl border border-white/10 bg-slate-950/95 px-4 py-3 text-left text-sm text-slate-100 shadow-2xl shadow-slate-950/40"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-violet-200">{hovered.label}</p>
                <p className="mt-2 font-semibold text-white">{statusMeta[hovered.status].label}</p>
                <p className="mt-1 text-slate-400">{statusMeta[hovered.status].description}</p>
              </motion.div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {Object.entries(statusMeta).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
              <span className={`h-3.5 w-3.5 rounded-full ${meta.classes}`} />
              <div>
                <p className="font-semibold text-white">{meta.label}</p>
                <p className="text-xs text-slate-500">{meta.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
