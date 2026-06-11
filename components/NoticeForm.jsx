"use client";

/**
 * NoticeForm.jsx
 * 
 * Modal form for creating a new notice with audience targeting.
 * Part of feat #2184 — Notice Board upgrades.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const ROLES = ["student", "teacher", "institute", "admin", "staff"];
const CATEGORIES = ["academic", "administrative", "financial", "general", "technical"];
const PRIORITIES = ["low", "medium", "high"];

export default function NoticeForm({ onClose, onSuccess }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [isPinned, setIsPinned] = useState(false);
  const [tags, setTags] = useState("");
  const [audienceMode, setAudienceMode] = useState("all");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleRole = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const buildTargetAudience = () => {
    if (audienceMode === "all") return ROLES;
    return selectedRoles.length > 0 ? selectedRoles : ROLES;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    if (audienceMode === "roles" && selectedRoles.length === 0) {
      toast.error("Please select at least one role.");
      return;
    }

    setSubmitting(true);
    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const body = {
        title: title.trim(),
        content: content.trim(),
        category,
        priority,
        isPinned,
        tags: tagArray,
        targetAudience: buildTargetAudience(),
      };

      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Failed to publish notice.");
      }

      toast.success("Notice published! 🎉");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Create Notice</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notice title…"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              Content <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notice here…"
              rows={5}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          {/* Category / Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-300">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-300">
              Tags{" "}
              <span className="text-xs font-normal text-slate-500">
                (comma separated)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. exam, fee, holiday"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Pin toggle */}
          <label className="flex cursor-pointer items-center gap-3">
            <div
              onClick={() => setIsPinned((p) => !p)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isPinned ? "bg-indigo-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isPinned ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-slate-300">
              Pin this notice
            </span>
          </label>

          {/* Audience Targeting */}
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-300">
              Target Audience
            </p>
            <div className="flex gap-3">
              {["all", "roles"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setAudienceMode(mode)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    audienceMode === mode
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {mode === "all" ? "Everyone" : "By Role"}
                </button>
              ))}
            </div>

            <AnimatePresence>
              {audienceMode === "roles" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                        selectedRoles.includes(role)
                          ? "bg-indigo-500/80 text-white border border-indigo-400"
                          : "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                  {selectedRoles.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1 w-full">
                      Select at least one role.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Publishing…" : "Publish Notice"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
