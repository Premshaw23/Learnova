"use client";

import { motion } from "framer-motion";

const SkeletonCard = ({ delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: "easeOut" }}
    className="rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-6 shadow-2xl shadow-slate-950/20"
  >
    <div className="animate-pulse space-y-4">
      {/* Category label */}
      <div className="h-3 w-24 rounded-full bg-slate-800" />

      {/* Title */}
      <div className="h-5 w-3/4 rounded-full bg-slate-800" />

      {/* Description lines */}
      <div className="space-y-2 pt-2">
        <div className="h-4 w-full rounded-full bg-slate-800" />
        <div className="h-4 w-full rounded-full bg-slate-800" />
        <div className="h-4 w-5/6 rounded-full bg-slate-800" />
      </div>

      {/* Tags */}
      <div className="flex gap-2 pt-2">
        <div className="h-6 w-16 rounded-full bg-slate-800" />
        <div className="h-6 w-20 rounded-full bg-slate-800" />
      </div>

      {/* Metadata */}
      <div className="grid gap-3 sm:grid-cols-3 pt-2">
        <div className="h-10 rounded-3xl bg-slate-800" />
        <div className="h-10 rounded-3xl bg-slate-800" />
        <div className="h-10 rounded-3xl bg-slate-800" />
      </div>
    </div>
  </motion.div>
);

const NoticeSkeleton = ({ count = 4 }) => (
  <div className="grid gap-5 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} delay={index * 0.1} />
    ))}
  </div>
);

export default NoticeSkeleton;
