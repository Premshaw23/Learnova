"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NavLink({ href, label, isActive }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="relative text-sm font-semibold tracking-wide px-3 xl:px-4 py-2 rounded-xl group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 border border-indigo-500/25 dark:border-indigo-400/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
        />
      )}
      <span className="absolute inset-0 rounded-xl bg-zinc-200/60 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
      <span
        className={`relative z-10 transition-colors duration-300 whitespace-nowrap ${
          isActive
            ? "text-indigo-600 font-semibold dark:text-indigo-400"
            : "text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-300"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}
