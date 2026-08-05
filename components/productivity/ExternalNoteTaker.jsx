"use client";

import React, { useState, useEffect } from "react";
import { BookMarked, Share, Check, X, Link as LinkIcon, FileText, Share2 } from "lucide-react";

/**
 * ExternalNoteTaker Component
 * 
 * Seamlessly integrates with personal knowledge management tools like 
 * Notion, Evernote, and Obsidian. Allows students to quickly capture 
 * formatted notes with timestamps without leaving the course interface.
 */
export default function ExternalNoteTaker({ currentContext = "React Fundamentals: Hooks", currentTimestamp = "04:32" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [exportStatus, setExportStatus] = useState("idle"); // idle, exporting, success, error

  const providers = [
    { id: "notion", name: "Notion", color: "bg-gray-800", textColor: "text-white" },
    { id: "evernote", name: "Evernote", color: "bg-green-600", textColor: "text-white" },
    { id: "obsidian", name: "Obsidian", color: "bg-purple-600", textColor: "text-white" }
  ];

  // Mock global text selection listener to auto-populate notes
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 10) {
        setNoteContent(selection.toString());
        setIsOpen(true);
      }
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  const handleExport = () => {
    if (!selectedProvider || !noteContent) return;

    setExportStatus("exporting");

    // Simulate OAuth / API push to external provider
    setTimeout(() => {
      setExportStatus("success");
      
      // Auto close after success
      setTimeout(() => {
        setIsOpen(false);
        setExportStatus("idle");
        setNoteContent("");
        setSelectedProvider(null);
      }, 2500);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 hover:scale-105 transition-all z-40 border border-gray-700"
        title="Quick Capture Notes"
      >
        <BookMarked size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-gray-900 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="font-bold flex items-center gap-2">
          <Share2 size={16} className="text-blue-400" /> Quick Capture
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        <div className="mb-3 text-xs font-semibold text-gray-500 flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
          <span className="flex items-center gap-1"><FileText size={12}/> {currentContext}</span>
          <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded"><LinkIcon size={10}/> {currentTimestamp}</span>
        </div>

        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="Jot down a note or highlight text on the page to auto-capture..."
          className="w-full h-32 p-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-4"
        ></textarea>

        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Sync To</p>
        <div className="flex gap-2 mb-4">
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all border-2 ${
                selectedProvider === p.id 
                  ? `${p.color} ${p.textColor} border-transparent shadow-md scale-105` 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={!selectedProvider || !noteContent || exportStatus === "exporting"}
          className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            exportStatus === "success" 
              ? "bg-green-500 text-white" 
              : !selectedProvider || !noteContent 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
          }`}
        >
          {exportStatus === "idle" && (
            <>
              <Share size={18} /> Export Note
            </>
          )}
          {exportStatus === "exporting" && (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Syncing...
            </>
          )}
          {exportStatus === "success" && (
            <>
              <Check size={18} /> Synced Successfully!
            </>
          )}
        </button>
      </div>
    </div>
  );
}
