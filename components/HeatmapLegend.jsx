import React from "react";

const HeatmapLegend = () => {
  return (
    <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 select-none">
      <span>Less</span>
      <div className="w-3.5 h-3.5 rounded-[4px] bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700/50" title="0 activity" />
      <div className="w-3.5 h-3.5 rounded-[4px] bg-violet-200 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-800/40" title="1 activity" />
      <div className="w-3.5 h-3.5 rounded-[4px] bg-violet-400 dark:bg-violet-700/60 border border-violet-500 dark:border-violet-600/50" title="2-3 activities" />
      <div className="w-3.5 h-3.5 rounded-[4px] bg-violet-600 dark:bg-violet-500/80 border border-violet-700 dark:border-violet-400/60" title="4-5 activities" />
      <div className="w-3.5 h-3.5 rounded-[4px] bg-violet-800 dark:bg-violet-400 border border-violet-900 dark:border-violet-300/70" title="6+ activities" />
      <span>More</span>
    </div>
  );
};

export default HeatmapLegend;
