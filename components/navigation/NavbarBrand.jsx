"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function NavbarBrand({ onNavigate }) {
  return (
    <Link
      href="/"
      onClick={onNavigate}
      className="flex items-center space-x-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded-xl"
      aria-label="Learnova home"
    >
      <motion.div
        whileHover={{ scale: 1.08, rotate: -4 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 18 }}
        className="relative"
      >
        <span className="absolute inset-0 rounded-xl bg-indigo-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
        <div className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-600/25 border border-white/10">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </div>
      </motion.div>
      <div className="flex flex-col">
        <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
          Learnova
        </span>
        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-black leading-none">
          Premium
        </span>
      </div>
    </Link>
  );
}
