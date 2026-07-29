"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Users, Clock, LogOut } from "lucide-react";
import ParticipantList from "./ParticipantList";
import ChatPanel from "./ChatPanel";

const StudyRoom = ({
  room,
  currentUserId,
  onLeave,
  onSendMessage,
  messages = [],
  participants = [],
}) => {
  const [activeTab, setActiveTab] = useState("chat");
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const startTime = room.createdAt ? new Date(room.createdAt).getTime() : Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [room.createdAt]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onLeave}
              className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{room.name}</h1>
              <p className="text-xs text-slate-400">
                Hosted by {room.hostName} · {participants.length}/10 participants
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-xl text-sm text-slate-300">
              <Clock className="w-4 h-4 text-indigo-400" />
              {formatTime(elapsedTime)}
            </div>
            <button
              onClick={onLeave}
              className="p-2 hover:bg-red-500/20 rounded-xl text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex gap-4 h-[calc(100vh-73px)]">
        {/* Sidebar - Participants */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <ParticipantList participants={participants} currentUserId={currentUserId} />
        </div>

        {/* Center - Main Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tab Bar */}
          <div className="flex gap-1 mb-4 bg-black/30 p-1 rounded-xl w-fit">
            {["chat", "whiteboard", "editor"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 min-h-0">
            {activeTab === "chat" && (
              <div className="h-full">
                <ChatPanel
                  messages={messages}
                  onSendMessage={onSendMessage}
                  currentUserId={currentUserId}
                />
              </div>
            )}

            {activeTab === "whiteboard" && (
              <div className="h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <span className="text-3xl">🎨</span>
                  </div>
                  <p className="text-lg font-medium text-white mb-1">Shared Whiteboard</p>
                  <p className="text-sm">Real-time collaborative drawing coming soon</p>
                </div>
              </div>
            )}

            {activeTab === "editor" && (
              <div className="h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center">
                <div className="text-center text-slate-500">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="text-lg font-medium text-white mb-1">Collaborative Editor</p>
                  <p className="text-sm">Real-time shared document editing coming soon</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyRoom;
