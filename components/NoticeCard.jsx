"use client";

import {
  Clock,
  Download,
  Eye,
  EyeOff,
  Pin,
  Share2,
  User,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useCallback } from "react";
import { motion } from "framer-motion";

const priorityStyles = {
  high: "bg-red-500/10 text-red-200 border border-red-500/30",
  medium: "bg-amber-500/10 text-amber-200 border border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30",
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildNoticeFileName = (notice, extension = "txt") => {
  const baseName = `${notice?.title || "notice"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${baseName || "notice"}.${extension}`;
};

const formatNoticeForExport = (notice, isRead, relativeTime) => {
  const tags = notice.tags || [];
  const createdAt = notice.createdAt ? new Date(notice.createdAt) : new Date();

  return [
    notice.title || "Untitled notice",
    "",
    `Category: ${notice.category || "General"}`,
    `Priority: ${notice.priority || "medium"}`,
    `Status: ${isRead ? "Read" : "Unread"}`,
    `Author: ${notice.author || "Unknown"}`,
    `Published: ${createdAt.toLocaleString()}`,
    `Relative time: ${relativeTime}`,
    `Tags: ${tags.length > 0 ? tags.map((tag) => `#${tag}`).join(", ") : "None"}`,
    "",
    notice.content || "",
  ].join("\n");
};

const createTextDownload = (content, fileName) => {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8",
  });

  const fileUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = fileUrl;
  downloadLink.download = fileName;
  downloadLink.rel = "noopener noreferrer";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  URL.revokeObjectURL(fileUrl);
};

const createPdfDownload = (notice, content) => {
  const doc = new jsPDF();
  const margin = 16;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const lineHeight = 7;
  const headingY = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(notice.title || "Untitled notice", margin, headingY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const lines = doc.splitTextToSize(content, maxWidth);
  let cursorY = headingY + 10;

  lines.forEach((line) => {
    if (cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }

    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  doc.save(buildNoticeFileName(notice, "pdf"));
};

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
  const relativeTime = getRelativeTime(notice.createdAt);
  const exportText = formatNoticeForExport(notice, isRead, relativeTime);
  const tags = notice.tags || [];

  const handleExportNotice = useCallback(() => {
    if (typeof window === "undefined") return;

    createTextDownload(exportText, buildNoticeFileName(notice, "txt"));
  }, [exportText, notice]);

  const handlePdfExportNotice = useCallback(() => {
    if (typeof window === "undefined") return;

    createPdfDownload(notice, exportText);
  }, [exportText, notice]);

  const handleShareNotice = useCallback(async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: notice.title || "Notice",
          text: exportText,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }

    handleExportNotice();
  }, [exportText, handleExportNotice, notice.title]);

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

        <div className="flex flex-wrap gap-2 sm:justify-end">
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

          <motion.button
            type="button"
            onClick={handleExportNotice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 active:scale-95"
            aria-label={`Download ${notice.title || "notice"} as text`}
          >
            <Download className="h-4 w-4" />
            Text
          </motion.button>

          <motion.button
            type="button"
            onClick={handlePdfExportNotice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 active:scale-95"
            aria-label={`Download ${notice.title || "notice"} as PDF`}
          >
            <Download className="h-4 w-4" />
            PDF
          </motion.button>

          <motion.button
            type="button"
            onClick={handleShareNotice}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/20 active:scale-95"
            aria-label={`Share ${notice.title || "notice"}`}
          >
            <Share2 className="h-4 w-4" />
            Share
          </motion.button>
        </div>
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
        {tags.map((tag, index) => (
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

