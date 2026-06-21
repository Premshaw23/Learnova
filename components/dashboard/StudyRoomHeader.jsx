import React from "react";
import CopyInviteButton from "../ui/CopyInviteButton";
import Image from "next/image";

/**
 * StudyRoomHeader Component
 * Demonstrates the integration of the CopyInviteButton inside the header of a real-time collaborative study room.
 */
const StudyRoomHeader = ({
  roomName = "Advanced AI Agents & Algorithms Study Room",
  activeUsersCount = 5,
}) => {
  return (
    <header className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Side: Room Details and Status */}
        <div className="flex items-start gap-3">
          {/* Room Live Indicator */}
          <div className="relative flex h-3 w-3 mt-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-slate-950 dark:text-white leading-snug">
                {roomName}
              </h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                LIVE
              </span>
            </div>

            {/* Active Users Badge */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-1.5 overflow-hidden">
                {/* Simulated Avatars */}
                <Image
                  className="inline-block rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                  alt="User 1"
                  width={20}
                  height={20}
                />
                <Image
                  className="inline-block rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"
                  alt="User 2"
                  width={20}
                  height={20}
                />
                <Image
                  className="inline-block rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
                  alt="User 3"
                  width={20}
                  height={20}
                />
              </div>
              <span className="font-medium text-xs">
                {activeUsersCount} peers collaborating
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive room tools */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Active Collaborators Quick Action Indicators */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 pr-4 mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>All systems sync</span>
          </div>

          {/* Copy Invite Link Action (The new CopyInviteButton component) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden md:inline">
              Invite Peer:
            </span>
            <CopyInviteButton />
          </div>

          {/* Leave Session Button */}
          <button
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-semibold rounded-xl text-sm border border-rose-100 dark:border-rose-950/40 active:scale-95 transition-all duration-200"
            aria-label="Action button"
          >
            End Session
          </button>
        </div>
      </div>
    </header>
  );
};

export default StudyRoomHeader;
