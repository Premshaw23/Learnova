import React from "react";

/**
 * A highly reusable, beautifully designed, and responsive EmptyState UI component.
 * Supports light/dark mode, micro-animations, customizable action buttons, and handles fallback SVGs.
 * Designed to guide users elegantly when no content or data is present.
 */
const EmptyState = ({
  title = "No data found",
  description = "Get started by creating your first entry or enrolling in an active module.",
  buttonText = "Get Started",
  onAction = () => {},
  icon,
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-6 py-12 md:py-16 max-w-md mx-auto rounded-2xl bg-white/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 backdrop-blur-sm shadow-sm transition-all duration-300 ${className}`}>
      
      {/* Icon Wrapper with subtle background pulse/glow */}
      <div className="relative mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:scale-105 transition-transform duration-300">
        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
        {icon ? (
          icon
        ) : (
          /* Default beautiful abstract folder SVG with a Sparkles badge */
          <svg
            className="w-10 h-10 text-indigo-500/80 dark:text-indigo-400/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h1.528c.30 0 .587.16.744.418l1.13 1.83a.75.75 0 00.626.382H21.75c.376 0 .733.141 1 .375m-20.5 0a2.25 2.25 0 002.25 2.25h15.5a2.25 2.25 0 002.25-2.25m-20.5 0v3.75m20.5-3.75v3.75m-11.6-6a1.5 1.5 0 00-2.2-2.2m5.4-3a1.5 1.5 0 00-2.2-2.2m5.4 6a1.5 1.5 0 00-2.2-2.2"
            />
          </svg>
        )}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8 max-w-sm">
        {description}
      </p>

      {/* CTA Button */}
      {buttonText && (
        <button
          onClick={onAction}
          className="relative px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/20 dark:shadow-indigo-500/10 hover:shadow-indigo-500/30 active:scale-95 active:shadow-sm transition-all duration-200"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
