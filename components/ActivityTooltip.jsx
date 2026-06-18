import React from "react";

const ActivityTooltip = ({ date, count, left, top }) => {
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full mb-3 rounded-2xl border border-white/10 bg-zinc-950/95 px-4 py-2.5 text-xs text-white shadow-2xl backdrop-blur-xl animate-fadeIn transition-all duration-150 ease-out"
      style={{ left: `${left}px`, top: `${top}px` }}
    >
      <p className="text-zinc-400 font-medium">{date}</p>
      <p className="mt-1 font-bold text-white">
        {count} {count === 1 ? "learning activity" : "learning activities"}
      </p>
    </div>
  );
};

export default ActivityTooltip;
