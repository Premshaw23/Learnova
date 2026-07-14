"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Trash2, Clock } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import toast from "react-hot-toast";

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function VideoPlayer({
  videoUrl,
  conceptMap,
  transcripts,
  courseId,
  user,
  updateUserStat,
}) {
  const videoRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTimestamps, setFilteredTimestamps] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");

  // Load notes on mount
  useEffect(() => {
    setMounted(true);
    const savedNotes = localStorage.getItem(`video_notes_${courseId}`);
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, [courseId]);

  // Persist notes when they change
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(`video_notes_${courseId}`, JSON.stringify(notes));
    }
  }, [notes, mounted, courseId]);

  // Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTimestamps([]);
      return;
    }
    const matches = transcripts.filter((t) =>
      t.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTimestamps(matches);
  }, [searchQuery, transcripts]);

  // Memoized seek handler
  const handleSeek = useCallback((seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
      toast.success(`Jumped to ${formatTime(seconds)}`);
    }
  }, []);

  // Memoized note adder
  const handleAddNote = useCallback(() => {
    if (!noteText.trim()) {
      toast.error("Note content cannot be empty");
      return;
    }
    const time = videoRef.current ? videoRef.current.currentTime : 0;
    const newNote = {
      id: Date.now().toString(),
      timestamp: time,
      formattedTime: formatTime(time),
      text: noteText.trim(),
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
    setNoteText("");
    toast.success("Note added at " + formatTime(time));
  }, [noteText]);

  // Memoized note deleter
  const deleteNote = useCallback((noteId) => {
    setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
    toast.success("Note removed");
  }, []);

  // Throttled progress save effect
  const handleTimeUpdate = useCallback(async () => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    const diff = Math.abs(currentTime - lastSavedTimeRef.current);

    if (diff >= 10) {
      lastSavedTimeRef.current = currentTime;
      try {
        // Throttled database progress synchronization
        if (user?.uid && updateUserStat) {
          // Increment study hours dynamically based on time played (approx 10s -> 0.0027 hours)
          await updateUserStat(user.uid, "Study Hours", 0.0028);
        }
      } catch (err) {
        console.warn("Failed to sync play time stats:", err);
      }
    }
  }, [user?.uid, updateUserStat]);

  // Restructured video sync useEffect hook
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [handleTimeUpdate]);

  if (!mounted) return null;

  return (
    <div className="my-8 p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 shadow-xl">
      {/* The Video Stream */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black mb-4">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
        />
      </div>

      {/* Segmented AI Concept Map Progress Track */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-zinc-400 block mb-2 tracking-wider uppercase">
          AI Concept Map Timeline
        </span>
        <div className="h-3 w-full bg-zinc-800 rounded-full flex overflow-hidden">
          {conceptMap.map((segment, index) => {
            const segmentWidth = ((segment.end - segment.start) / 300) * 100;
            const trackColors = [
              "bg-indigo-600/60",
              "bg-purple-600/60",
              "bg-pink-600/60",
            ];
            return (
              <div
                key={index}
                style={{ width: `${segmentWidth}%` }}
                className={`${trackColors[index % trackColors.length]} h-full border-r border-zinc-950/40 cursor-pointer transition-all hover:brightness-125`}
                onClick={() => handleSeek(segment.start)}
                title={`${segment.concept} (Click to jump)`}
              />
            );
          })}
        </div>
      </div>

      {/* User Search Input Field */}
      <div className="relative">
        <input
          type="text"
          placeholder="Type a topic to scan video timeline (e.g., 'backpropagation')..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Dropdown list of timestamps found by AI string filtering */}
      {filteredTimestamps.length > 0 && (
        <div className="mt-3 bg-zinc-950 rounded-xl border border-zinc-800 p-3 space-y-2 max-h-48 overflow-y-auto">
          <span className="text-xs text-indigo-400 font-bold block px-1">
            AI Matches Found:
          </span>
          {filteredTimestamps.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSeek(item.start)}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-900 transition-colors text-sm cursor-pointer"
            >
              <span className="text-indigo-400 font-mono font-semibold">
                {Math.floor(item.start / 60)}:
                {String(item.start % 60).padStart(2, "0")}
              </span>
              <span className="text-zinc-300 line-clamp-1">{item.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* 📝 VIDEO TIMESTAMP NOTES SECTION 📝 */}
      <div className="mt-8 pt-6 border-t border-zinc-800/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            Personal Timestamp Notes
          </h3>
          <span className="text-[10px] text-zinc-500 font-medium px-2 py-0.5 rounded-full bg-zinc-800/50">
            {notes.length} Total
          </span>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Take a quick note at the current video time..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
            className="flex-1 px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            onClick={handleAddNote}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shrink-0 shadow-lg shadow-indigo-600/10 active:scale-95 cursor-pointer"
          >
            Save Note
          </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="group relative bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all cursor-pointer"
                onClick={() => handleSeek(note.timestamp)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <span className="text-indigo-400 font-mono text-xs font-bold shrink-0 mt-0.5 px-2 py-1 rounded bg-indigo-500/5 border border-indigo-500/10">
                      {note.formattedTime}
                    </span>
                    <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                      {note.text}
                    </p>
                  </div>
                  <Tooltip content="Delete note" placement="top">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 rounded-2xl bg-zinc-950/20 border border-dashed border-zinc-800/80">
              <p className="text-sm text-zinc-500 italic">
                No timestamp notes yet. Save a moment to revisit it later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
