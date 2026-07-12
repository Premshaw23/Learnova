"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import VirtualWhiteboard from "@/components/VirtualWhiteboard";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { dashboardContentOffsetClass } from "@/components/navigation";

export default function VirtualClassPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className={`flex-1 flex flex-col ${dashboardContentOffsetClass}`}>
        {/* Header Area */}
        <div className="bg-card/40 backdrop-blur-md border-b border-white/5 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Video className="w-5 h-5 text-indigo-400" />
                Live Virtual Classroom
              </h1>
              <p className="text-xs text-muted-foreground">
                Collaborative Interactive Whiteboard Session
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-sm font-medium border border-green-500/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              Session Live
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 rounded-full text-sm text-gray-300">
              <Users className="w-4 h-4" />
              <span>{user ? user.displayName?.split(" ")[0] : "Student"} (You)</span>
            </div>
          </div>
        </div>

        {/* Whiteboard Area */}
        <div className="flex-1 relative bg-[#121212]">
          <VirtualWhiteboard />
        </div>
      </main>
    </div>
  );
}
