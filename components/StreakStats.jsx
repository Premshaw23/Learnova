import React from "react";

const StreakStats = ({ currentStreak, longestStreak }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="flex-1 flex items-center gap-3.5 bg-black/40 border border-white/10 rounded-[1.5rem] p-4 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/5">
        <span className="text-2xl" role="img" aria-label="flame">
          🔥
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 block">
            Current Streak
          </span>
          <h4 className="text-lg font-bold text-white mt-0.5">
            Current Streak: {currentStreak} Day{currentStreak === 1 ? "" : "s"}
          </h4>
        </div>
      </div>

      <div className="flex-1 flex items-center gap-3.5 bg-black/40 border border-white/10 rounded-[1.5rem] p-4 transition-all duration-300 hover:border-violet-500/30 hover:bg-white/5">
        <span className="text-2xl" role="img" aria-label="trophy">
          🏆
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 block">
            Longest Streak
          </span>
          <h4 className="text-lg font-bold text-white mt-0.5">
            Longest Streak: {longestStreak} Day{longestStreak === 1 ? "" : "s"}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default StreakStats;
