"use client";

import { motion } from "framer-motion";

const AttendanceBadge = ({
  icon,
  title,
  description,
  condition,
  unlocked,
  progress,
}) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-3xl border p-5 shadow-2xl transition-all duration-300 ${
        unlocked
          ? "border-cyan-400/20 bg-cyan-500/10 shadow-cyan-500/15"
          : "border-white/10 bg-white/5"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-80" />

      <div className="relative space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-3xl text-2xl shadow-lg transition-all duration-300 ${
              unlocked
                ? "bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/50"
                : "bg-slate-900 text-slate-300"
            }`}
          >
            {icon}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-300">{description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Unlock condition</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                unlocked
                  ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-200"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-500">
              <span>{condition}</span>
              <span>{Math.floor(progress)}%</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900/80">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  unlocked
                    ? "bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_24px_rgba(56,189,248,0.25)]"
                    : "bg-slate-600"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

export default AttendanceBadge;
