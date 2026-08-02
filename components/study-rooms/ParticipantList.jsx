"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Crown, Mic, MicOff, ScreenShare, Wifi } from "lucide-react";

const roleColors = {
  teacher: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  student: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const roleIcons = {
  teacher: Crown,
  admin: Crown,
  student: User,
};

const ParticipantList = ({ participants = [], currentUserId }) => {
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    const roleOrder = { teacher: 0, admin: 1, student: 2 };
    return (roleOrder[a.userRole] || 2) - (roleOrder[b.userRole] || 2);
  });

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Participants ({participants.length}/10)
        </h3>
        <div className="flex items-center gap-1 text-xs text-emerald-400">
          <Wifi className="w-3 h-3" />
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedParticipants.map((participant) => {
            const RoleIcon = roleIcons[participant.userRole] || User;
            const isCurrentUser = participant.userId === currentUserId;

            return (
              <motion.div
                key={participant.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                  isCurrentUser ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                    {participant.userName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">
                      {participant.userName}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-slate-400">(You)</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      roleColors[participant.userRole] || roleColors.student
                    }`}
                  >
                    {participant.userRole}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {participant.isMuted ? (
                    <MicOff className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  {participant.isScreenSharing && (
                    <ScreenShare className="w-3.5 h-3.5 text-blue-400" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {participants.length === 0 && (
          <div className="text-center py-6 text-slate-500 text-sm">
            No participants yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
