"use client";

import { Inbox, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const EmptyNoticeState = ({ query, onResetFilters }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, ease: "easeOut" }}
    className="flex min-h-[260px] flex-col items-center justify-center gap-5 rounded-[2rem] border border-slate-800 bg-slate-950/90 p-10 text-center shadow-2xl shadow-slate-950/25"
  >
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900/80 text-indigo-300 shadow-inner shadow-slate-950/30">
      <Inbox className="h-10 w-10" />
    </div>
    <div className="space-y-3">
      <p className="text-2xl font-semibold text-white">No notices found</p>
      <p className="max-w-xl text-sm leading-6 text-slate-400">
        {query
          ? `No notices match "${query}". Try broadening the keywords, selecting a different category, or removing some filters.`
          : "There are no notices available right now. Reset filters or try again later."}
      </p>
    </div>
    <button
      type="button"
      onClick={onResetFilters}
      className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
    >
      Reset filters
    </button>
    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
      <Sparkles className="h-4 w-4 text-indigo-300" />
      <span>Search by title, description, tags, or category for faster results.</span>
    </div>
  </motion.div>
);

export default EmptyNoticeState;
