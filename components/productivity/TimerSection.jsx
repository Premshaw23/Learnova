import { motion } from "framer-motion";
import { Timer, Play, Pause, RotateCcw, Flame } from "lucide-react";

export function TimerSection({
  mode,
  timeLeft,
  sessionSeconds,
  focusSessions,
  focusMinutes,
  isRunning,
  recentCompleted,
  MODES,
  switchMode,
  toggleTimer,
  resetTimer,
  applyManualTime,
  manualMinutes,
  setManualMinutes,
  isDark,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const modeAccent = MODES[mode]?.accent || "text-purple-300";

  return (
    <motion.div
      className={`${
        isDark
          ? "bg-black/40 border border-white/10 backdrop-blur-xl"
          : "bg-white/80 border border-slate-200 shadow-lg backdrop-blur-xl"
      } rounded-3xl p-6 md:p-8`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
        <div>
          <p
            className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            Pomodoro Timer
          </p>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Timer className={`w-5 h-5 ${modeAccent}`} />
            {MODES[mode]?.label || "Focus"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {["focus", "short", "long"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${
                mode === m
                  ? isDark
                    ? "bg-purple-500/20 border-purple-400/40 text-purple-200 shadow-lg shadow-purple-500/10"
                    : "bg-purple-100 border-purple-300 text-purple-900 shadow-lg shadow-purple-500/10"
                  : isDark
                    ? "border-white/10 text-slate-400 hover:text-white hover:border-white/30"
                    : "border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-400"
              }`}
            >
              {m === "focus" ? "Focus" : m === "short" ? "Short" : "Long"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <div
              className="absolute inset-0 rounded-full border-4 border-slate-200/40 dark:border-white/10"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(#a855f7 ${(1 - timeLeft / sessionSeconds) * 360}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            />
            <div className="absolute inset-2 rounded-full bg-slate-100/90 dark:bg-slate-950/70 flex items-center justify-center">
              <span className={`text-3xl font-bold ${modeAccent}`}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Focus sessions
            </p>
            <motion.div
              className="flex items-center gap-2 text-lg font-semibold"
              animate={recentCompleted ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Flame className="w-5 h-5 text-orange-300" />
              {focusSessions} completed
            </motion.div>
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Focus minutes today: {focusMinutes} min
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={toggleTimer}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600
              hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] text-white font-semibold
              flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all duration-300"
            aria-label="Action button"
          >
            {isRunning ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? "Pause" : "Start"}
          </button>
          <button
            onClick={resetTimer}
            className={`px-5 py-3 rounded-2xl border text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
              isDark
                ? "bg-white/10 border-white/10 text-slate-300 hover:text-white hover:bg-white/20"
                : "bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
            aria-label="Action button"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <form
            onSubmit={applyManualTime}
            className={`flex items-center gap-2 rounded-2xl px-3 py-2 border ${
              isDark
                ? "bg-black/40 border-white/10 backdrop-blur-xl"
                : "bg-white/80 border-slate-200 shadow-xl backdrop-blur-xl"
            }`}
          >
            <label
              htmlFor="pomodoro-minutes"
              className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
            >
              Min
            </label>
            <input
              id="pomodoro-minutes"
              type="number"
              min="1"
              max="180"
              value={manualMinutes}
              onChange={(event) => setManualMinutes(event.target.value)}
              className={`w-14 rounded-lg bg-transparent border px-2 py-1 text-sm text-center
                ${isDark ? "border-white/10 text-white" : "border-slate-200 text-slate-900"}
                focus:outline-none focus:ring-2 focus:ring-purple-400/40`}
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-xl bg-purple-500/80 text-white text-xs font-semibold hover:bg-purple-500 transition-colors"
              aria-label="Action button"
            >
              Set
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
