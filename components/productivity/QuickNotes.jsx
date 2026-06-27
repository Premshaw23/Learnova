"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, X, Save, Trash2, CheckCircle2 } from "lucide-react";

export default function QuickNotes() {
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [savedStatus, setSavedStatus] = useState("saved"); // 'saving', 'saved'

  // Load notes from local storage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem("learnova_quick_notes");
    if (savedNotes) {
      setNoteContent(savedNotes);
    }
  }, []);

  // Save notes to local storage with debounce
  useEffect(() => {
    if (!isOpen) return; // Only save when open to avoid overwriting with initial empty state
    
    setSavedStatus("saving");
    const timeoutId = setTimeout(() => {
      localStorage.setItem("learnova_quick_notes", noteContent);
      setSavedStatus("saved");
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteContent, isOpen]);

  const clearNotes = () => {
    if (confirm("Are you sure you want to clear your scratchpad?")) {
      setNoteContent("");
      localStorage.removeItem("learnova_quick_notes");
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-24 z-40 flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-colors"
        aria-label="Open Quick Notes"
      >
        <StickyNote className="w-5 h-5" />
      </motion.button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2 text-white">
                <StickyNote className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-sm">Quick Scratchpad</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* Status Indicator */}
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  {savedStatus === "saving" ? (
                    <Save className="w-3 h-3 animate-pulse text-indigo-400" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  )}
                  {savedStatus === "saving" ? "Saving..." : "Saved"}
                </span>
                
                <button
                  onClick={clearNotes}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
                  title="Clear Notes"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="p-4 flex-1 h-[300px]">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Jot down homework, reminders, or quick thoughts here... (Auto-saves locally)"
                className="w-full h-full bg-transparent text-slate-200 placeholder:text-slate-500 text-sm resize-none focus:outline-none scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                spellCheck="false"
              />
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-black/20">
              <p className="text-[10px] text-slate-500 text-center">
                Notes are saved securely in your browser's local storage.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
