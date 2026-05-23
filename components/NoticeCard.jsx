"use client";

import { Eye, EyeOff, Pin, User, Clock } from "lucide-react";
import { motion } from "framer-motion";

const priorityStyles = {
  high: "bg-red-500/10 text-red-200 border border-red-500/30",
  medium: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.split(regex).map((segment, index) =>
    segment.toLowerCase() === query.toLowerCase() ? (
      <span key={`${segment}-${index}`} className="rounded-xl bg-amber-300/20 px-0.5 text-amber-100">
        {segment}
      </span>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    )
  );
};

const NoticeCard = ({ notice, isRead, onToggleRead, searchQuery, getRelativeTime }) => {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950/80 to-slate-900/60 p-6 shadow-2xl shadow-slate-950/20 transition duration-300 hover:shadow-2xl hover:border-slate-700"
    >
      {notice.isPinned && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 p-2 text-slate-950 shadow-xl"
        >
          <Pin className="h-4 w-4" />
        </motion.div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-2 text-xs uppercase tracking-[0.32em] text-slate-500"
          >
            {notice.category}
          </motion.p>
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className={`text-xl font-semibold transition ${
              isRead ? "text-slate-200" : "text-white"
            }`}
          >
            {highlightMatch(notice.title, searchQuery)}
          </motion.h3>
        </div>

        <motion.button
          type="button"
          onClick={onToggleRead}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${
            isRead
              ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              : "border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20"
          }`}
          aria-label={isRead ? "Mark notice unread" : "Mark notice read"}
        >
          {isRead ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isRead ? "Unread" : "Read"}
        </motion.button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-4 text-sm leading-7 text-slate-400"
      >
        {highlightMatch(notice.content, searchQuery)}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="mt-5 flex flex-wrap gap-2"
      >
        {notice.tags.map((tag, index) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + index * 0.05 }}
            className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            #{tag}
          </motion.span>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 grid gap-3 sm:grid-cols-3 sm:items-center"
      >
        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
          <User className="h-4 w-4" />
          <span className="truncate">{notice.author}</span>
        </div>
        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
          <Clock className="h-4 w-4" />
          <span>{getRelativeTime(notice.createdAt)}</span>
        </div>
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold ${priorityStyles[notice.priority]}`}>
          {notice.priority}
        </span>
      </motion.div>
    </motion.article>
  );
};

export default NoticeCard;

