export function getNavbarGlassStyle({ isDark, scrolled }) {
  return {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    backgroundColor: isDark
      ? scrolled
        ? "rgba(7, 11, 20, 0.92)"
        : "rgba(7, 11, 20, 0.72)"
      : scrolled
        ? "rgba(255, 255, 255, 0.94)"
        : "rgba(255, 255, 255, 0.78)",
    borderBottom: isDark
      ? scrolled
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(255, 255, 255, 0.06)"
      : scrolled
        ? "1px solid rgba(0, 0, 0, 0.07)"
        : "1px solid rgba(0, 0, 0, 0.04)",
    boxShadow: scrolled
      ? isDark
        ? "0 4px 32px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(99, 102, 241, 0.08) inset"
        : "0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.9) inset"
      : "none",
  };
}

export const glassPanelStyle = {
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

export const dropdownPanelClass =
  "absolute right-0 mt-2 bg-white/90 dark:bg-[#0B1120]/95 border border-zinc-200/60 dark:border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden";

export const iconBtnClass =
  "relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 hover:bg-zinc-100/80 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60";

export const navCapsuleClass =
  "hidden lg:flex items-center bg-zinc-100/60 dark:bg-white/[0.04] border border-zinc-200/50 dark:border-white/10 rounded-2xl p-1 gap-0.5";

export const sidebarGlassClass =
  "bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border border-zinc-200/60 dark:border-white/10 shadow-2xl";

export const gradientBorderTop = (isDark) =>
  isDark
    ? "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.45) 35%, rgba(139, 92, 246, 0.35) 65%, transparent)"
    : "linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.25) 35%, rgba(139, 92, 246, 0.18) 65%, transparent)";
