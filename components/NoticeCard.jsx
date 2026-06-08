"use client";

import {
  Clock,
  Download,
  Eye,
  EyeOff,
  Pin,
  Share2,
  User,
  Copy,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

const createPdfDownload = (notice) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  // 1. Branding Letterhead Header
  doc.setFillColor(79, 70, 229); // indigo header background bar
  doc.rect(0, 0, pageWidth, 4, "F");

  // Institution Label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("LEARNOVA ACADEMY • CAMPUS NOTICE BOARD", margin, 18);

  // Divider Slate Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(margin, 22, pageWidth - margin, 22);

  // 2. Notice Category Badge
  const category = (notice.category || "General").toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setFillColor(243, 244, 246); // light slate background

  // Calculate text width to make the badge width dynamic
  const catWidth = doc.getTextWidth(category);
  const badgeWidth = catWidth + 8;
  doc.roundedRect(margin, 28, badgeWidth, 6, 1.5, 1.5, "F");
  doc.setTextColor(79, 70, 229); // Indigo text
  doc.text(category, margin + 4, 32.2);

  // 3. Notice Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate-900 (highly readable dark text)

  // Split title to size to handle long titles wrapping
  const wrappedTitle = doc.splitTextToSize(
    notice.title || "Untitled Notice",
    contentWidth
  );
  let cursorY = 44;
  wrappedTitle.forEach((line) => {
    doc.text(line, margin, cursorY);
    cursorY += 8;
  });

  // 4. Metadata Box
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500

  const createdAt = notice.createdAt ? new Date(notice.createdAt) : new Date();
  const dateStr = createdAt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  const timeStr = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = createdAt.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = createdAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  doc.text(`Author: ${notice.author || "Unknown"}`, margin, cursorY);
  doc.text(`Published: ${dateStr} at ${timeStr}`, margin + 62, cursorY);

  // Color-coded priority badges matching UI
  const priority = (notice.priority || "medium").toLowerCase();
  doc.text("Priority:", margin + 130, cursorY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  if (priority === "high") {
    doc.setFillColor(254, 226, 226); // Red-100
    doc.setTextColor(220, 38, 38); // Red-600
  } else if (priority === "low") {
    doc.setFillColor(209, 250, 229); // Emerald-100
    doc.setTextColor(5, 150, 105); // Emerald-600
  } else {
    doc.setFillColor(254, 243, 199); // Amber-100
    doc.setTextColor(217, 119, 6); // Amber-600
  }
  doc.roundedRect(margin + 144, cursorY - 3.5, 18, 5, 1, 1, "F");
  doc.text(priority.toUpperCase(), margin + 146, cursorY - 0.1);

  // Revert defaults
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");

  // Render Tags row with styled pills
  cursorY += 7;
  const tags = notice.tags || [];
  if (tags.length > 0) {
    doc.text("Tags:", margin, cursorY);
    let tagX = margin + 11;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    tags.forEach((tag) => {
      const tagText = `#${tag}`;
      const tagWidth = doc.getTextWidth(tagText);
      doc.setFillColor(243, 244, 246); // Slate-100
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.roundedRect(tagX, cursorY - 3.2, tagWidth + 4, 4.5, 1, 1, "F");
      doc.text(tagText, tagX + 2, cursorY + 0.1);
      tagX += tagWidth + 7;
    });

    // Revert defaults
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
  }

  // Horizontal Rule under Metadata
  cursorY += 4;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 10;

  // 5. Notice Body / Content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(51, 65, 85); // Slate-700

  // ── FIX FOR ISSUE #2007: Safe text extraction and fallback ──
  const rawContent = notice.content || notice.text;
  const safeContent = (typeof rawContent === "string" && rawContent.trim().length > 0)
    ? rawContent
    : "No text content provided for this notice.";
  // ────────────────────────────────────────────────────────────

  const lines = doc.splitTextToSize(safeContent, contentWidth);
  const lineHeight = 6.5;

  lines.forEach((line) => {
    if (cursorY > pageHeight - margin - 15) {
      // Add dynamic footer before creating a new page
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Official Notice Board • Learnova", margin, pageHeight - 10);

      doc.addPage();

      // Indigo top bar on the second page
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 4, "F");

      cursorY = margin + 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
    }

    doc.text(line, margin, cursorY);
    cursorY += lineHeight;
  });

  // Footer for the final page
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Official Campus Notice • Generated via Learnova Smart Notice Board",
    margin,
    pageHeight - 10
  );

  doc.save(buildNoticeFileName(notice, "pdf"));
};

const highlightMatch = (text, query) => {
  if (!query || !text) return text;
  const escaped = escapeRegExp(query);
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.split(regex).map((segment, index) =>
    segment.toLowerCase() === query.toLowerCase() ? (
      <span
        key={`${segment}-${index}`}
        className="rounded-xl bg-amber-300/20 px-0.5 text-amber-100"
      >
        {segment}
      </span>
    ) : (
      <span key={`${segment}-${index}`}>{segment}</span>
    )
  );
};

const NoticeCard = ({
  notice,
  isRead,
  onToggleRead,
  searchQuery,
  getRelativeTime,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const relativeTime = getRelativeTime(notice.createdAt);
  const exportText = formatNoticeForExport(notice, isRead, relativeTime);
  const tags = notice.tags || [];

  const handleExportNotice = useCallback(() => {
    if (typeof window === "undefined") return;

    createTextDownload(exportText, buildNoticeFileName(notice, "txt"));
  }, [exportText, notice]);

  const handlePdfExportNotice = useCallback(() => {
    if (typeof window === "undefined") return;

    createPdfDownload(notice);
  }, [notice]);

  const handleCopyMarkdown = useCallback(async () => {
    if (typeof window === "undefined") return;

    const createdAt = notice.createdAt
      ? new Date(notice.createdAt)
      : new Date();
    const dateStr = createdAt.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = createdAt.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const mdText = [
      `# ${notice.title || "Untitled Notice"}`,
      "",
      `**Category:** ${notice.category || "General"}`,
      `**Author:** ${notice.author || "Unknown"}`,
      `**Published:** ${dateStr} at ${timeStr}`,
      `**Priority:** ${notice.priority || "medium"}`,
      "",
      "---",
      "",
      notice.content || "",
    ].join("\n");

    try {
      // FIX FOR ISSUE #2006: Add toast confirmation on success
      await navigator.clipboard.writeText(mdText);
      setCopyFeedback(true);
      toast.success('Notice link copied to clipboard!');
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error("Failed to copy markdown to clipboard", err);
      // Fallback UI/UX error handling
      toast.error('Failed to copy. Check browser permissions.');
    }
  }, [notice]);

  const handleCopyLink = useCallback(async () => {
    const noticeUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/notices/${notice.id}`
        : "";

    try {
      await navigator.clipboard.writeText(noticeUrl);

      setCopyFeedback(true);

      setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy notice link", err);
    }
  }, [notice]);

  const handleShareNotice = useCallback(async () => {
    const noticeUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/notices/${notice.id}`
        : "";
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function"
    ) {
      try {
        await navigator.share({
          title: notice.title || "Notice",
          text: notice.content || "",
          url: noticeUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
      }
    }
    try {
      await navigator.clipboard.writeText(noticeUrl);
      setCopyFeedback(true);
      setTimeout(() => {
        setCopyFeedback(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy notice URL", err);
    }
  }, [notice]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950/80 to-slate-900/60 p-6 shadow-2xl shadow-slate-950/20 transition duration-300 hover:shadow-2xl hover:border-slate-700"
    >
      {/* Copied To Clipboard HUD Toast */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 left-4 z-40 bg-indigo-500/90 text-white border border-indigo-400/20 backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <span>📋</span>
            <span>Markdown Copied!</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            className={`text-xl font-semibold transition ${isRead ? "text-slate-200" : "text-white"
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
            className={`inline-flex items-center gap-2 rounded-3xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${isRead
              ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
              : "border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20"
              }`}
            aria-label={isRead ? "Mark notice unread" : "Mark notice read"}
          >
            {isRead ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
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
            onClick={handleCopyMarkdown}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/20 active:scale-95"
            aria-label={`Copy markdown representation of ${notice.title || "notice"}`}
          >
            <Copy className="h-4 w-4" />
            Markdown
          </motion.button>

          <motion.button
            type="button"
            onClick={handleCopyLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-3xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 active:scale-95"
            aria-label={`Copy link for ${notice.title || "notice"}`}
          >
            <Copy className="h-4 w-4" />
            Copy Link
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

      {/* Attachments — feat #2184: rich media support */}
      {notice.attachments?.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Attachments
          </p>
          {notice.attachments.map((att, i) => (
            <div key={i}>
              {att.type === "link" ? (
                
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-sky-400 hover:underline break-all"
                >
                  🔗 {att.name}
                </a>
              ) : att.type?.startsWith("image/") ? (
                
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="rounded-xl max-h-48 w-full object-cover border border-slate-700 hover:opacity-90 transition"
                  />
                </a>
              ) : att.type === "application/pdf" ? (
                <div className="rounded-xl overflow-hidden border border-slate-700">
                  <iframe
                    src={att.url}
                    title={att.name}
                    className="w-full h-48"
                  />
                  
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition"
                  >
                    📄 {att.name} — Open PDF
                  </a>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

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
        <span
          className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold ${priorityStyles[notice.priority]}`}
        >
          {notice.priority}
        </span>
      </motion.div>
    </motion.article>
  );
};

export default NoticeCard;
