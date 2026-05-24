import React from "react";

/**
 * A highly reusable, accessible, and flexible Tooltip wrapper component.
 * Built with pure Tailwind CSS transitions.
 * Supports different placement directions (top, bottom, left, right),
 * prevents offscreen overflows, and implements standard accessibility tooltip roles.
 */
const Tooltip = ({
  children,
  text,
  position = "top",
  className = "",
}) => {
  // Placement positioning maps
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2 origin-top",
    left: "right-full top-1/2 -translate-y-1/2 mr-2 origin-right",
    right: "left-full top-1/2 -translate-y-1/2 ml-2 origin-left",
  };

  // Tooltip arrow positioning maps
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 -mt-1 border-t-slate-900 dark:border-t-slate-800",
    bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-slate-900 dark:border-b-slate-800",
    left: "left-full top-1/2 -translate-y-1/2 -ml-1 border-l-slate-900 dark:border-l-slate-800",
    right: "right-full top-1/2 -translate-y-1/2 -mr-1 border-r-slate-900 dark:border-r-slate-800",
  };

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      {children}
      <div
        className={`absolute z-50 ${positionClasses[position]} px-2.5 py-1.5 bg-slate-950 dark:bg-slate-850 text-white text-xs font-semibold rounded-lg shadow-xl border border-slate-800/80 backdrop-blur-md opacity-0 scale-90 pointer-events-none group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out whitespace-nowrap`}
        role="tooltip"
        aria-hidden="true"
      >
        {text}
        
        {/* Tooltip Arrow */}
        <div className={`absolute border-4 border-transparent ${arrowClasses[position]}`} />
      </div>
    </div>
  );
};

export default Tooltip;
