"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Timer, Play, Pause, RotateCcw, Headphones, Users, Flame } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function PomodoroRoomsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      handleSessionEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionEnd = async () => {
    setIsActive(false);
    if (!isBreak) {
      // Focus session ended, award XP
      toast.success("Focus session complete! Earning XP...");
      try {
        const res = await fetch("/api/pomodoro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ minutesFocused: 25 })
        });
        const data = await res.json();
        if (data.success) {
          toast.success(`You earned ${data.xpEarned} XP!`, { icon: '🔥' });
        }
      } catch (e) {
        console.error(e);
      }
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 min break
    } else {
      toast("Break is over! Time to focus.", { icon: '⏰' });
      setIsBreak(false);
      setTimeLeft(25 * 60); // 25 min focus
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleAudio = () => {
    if (audioPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 w-full flex-1 flex flex-col items-center">
        
        <header className="mb-12 text-center w-full">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 mb-6">
            <Timer className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 flex justify-center items-center gap-3">
            Co-studying Room
            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-sm border border-rose-500/20 flex items-center gap-1">
              <Users className="w-4 h-4" /> 12 Online
            </span>
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Focus alongside your peers. Complete 25-minute focus blocks to earn XP and build your study streak.
          </p>
        </header>

        <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-12 flex flex-col items-center relative overflow-hidden">
          <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${isBreak ? 'bg-cyan-500' : 'bg-rose-500'}`} />
          
          <h2 className="text-xl font-medium text-zinc-400 mb-8 z-10 relative">
            {isBreak ? "Break Time" : "Focus Time"}
          </h2>

          <div className="text-8xl font-black tracking-tighter text-white mb-12 tabular-nums z-10 relative">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-6 z-10 relative">
            <button
              onClick={toggleTimer}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isActive 
                  ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' 
                  : 'bg-rose-600 text-white hover:bg-rose-500 hover:scale-105 shadow-rose-600/20'
              }`}
            >
              {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-2" />}
            </button>
            <button
              onClick={resetTimer}
              className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center transition-all"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Whiteboard Link */}
          <div className="mt-8 border-t border-zinc-800 pt-6 z-10 w-full">
            <Link href="/student/pomodoro/whiteboard" className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-all">
              Open Group Whiteboard
            </Link>
          </div>
        </div>

        <div className="mt-12 w-full max-w-md">
          <button
            onClick={toggleAudio}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
              audioPlaying 
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5" />
              <span className="font-medium">Lofi Study Beats</span>
            </div>
            {audioPlaying ? (
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping" /> Playing
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider">Paused</span>
            )}
          </button>
          <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" />
        </div>

      </div>
    </div>
  );
}
