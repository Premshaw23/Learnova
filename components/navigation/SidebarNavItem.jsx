"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SIDEBAR_LAYOUT_ID } from "./constants";

export default function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  collapsed,
  onNavigate,
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
        isActive
          ? "text-indigo-600 dark:text-indigo-300"
          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      {isActive && (
        <motion.span
          layoutId={SIDEBAR_LAYOUT_ID}
          className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/20 dark:border-indigo-400/15"
          transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
        />
      )}
      <span
        className={`relative z-10 flex shrink-0 items-center justify-center rounded-lg p-1.5 transition-colors ${
          isActive
            ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
            : "bg-zinc-100/80 dark:bg-white/5 text-zinc-500 dark:text-zinc-400"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      {!collapsed && (
        <span className="relative z-10 truncate">{label}</span>
      )}
      {!collapsed && isActive && (
        <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
      )}
    </Link>
  );
}
