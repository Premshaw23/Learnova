"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, BookOpen, BarChart2 } from "lucide-react";

/**
 * IntegratedPomodoroTimer Component
 * 
 * A native Pomodoro timer embedded into the learning interface.
 * Tracks focused study sessions, broadcasts events to pause videos during breaks, 
 * and visualizes study habits.
 */
export default function IntegratedPomodoroTimer() {
  const FOCUS_TIME = 25 * 60; // 25 minutes
  const BREAK_TIME = 5 * 60; // 5 minutes

  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("focus"); // 'focus' or 'break'
  
  // Dashboard states
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [weeklyData, setWeeklyData] = useState([
    { day: "Mon", mins: 50 },
    { day: "Tue", mins: 125 },
    { day: "Wed", mins: 75 },
    { day: "Thu", mins: 100 },
    { day: "Fri", mins: 0 },
    { day: "Sat", mins: 0 },
    { day: "Sun", mins: 0 },
  ]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === "focus" ? FOCUS_TIME : BREAK_TIME);
    
    // Broadcast event to other components (like VideoPlayer) to pause/play
    const eventName = newMode === "break" ? "pomodoro:breakStart" : "pomodoro:focusStart";
    window.dispatchEvent(new CustomEvent(eventName));
  };

  const handleSessionComplete = useCallback(() => {
    // Play sound notification
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}

    if (mode === "focus") {
      setSessionsCompleted((prev) => prev + 1);
      setTotalFocusMinutes((prev) => prev + 25);
      
      // Update today's data (assuming Friday for demo purposes)
      const newWeeklyData = [...weeklyData];
      newWeeklyData[4].mins += 25; 
      setWeeklyData(newWeeklyData);

      switchMode("break");
    } else {
      switchMode("focus");
    }
  }, [mode, weeklyData]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, handleSessionComplete]);

  // Pause video if user switches to break manually while active
  useEffect(() => {
    if (mode === "break" && isActive) {
      window.dispatchEvent(new CustomEvent("pomodoro:breakStart"));
    }
  }, [mode, isActive]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const maxWeeklyMins = Math.max(...weeklyData.map(d => d.mins), 150);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row max-w-4xl mx-auto">
      
      {/* Timer Section */}
      <div className={`p-8 w-full md:w-1/2 flex flex-col items-center justify-center transition-colors duration-500 ${mode === 'focus' ? 'bg-blue-50' : 'bg-green-50'}`}>
        <div className="flex gap-4 mb-8 bg-white p-1 rounded-full shadow-sm">
          <button 
            onClick={() => switchMode("focus")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${mode === "focus" ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <BookOpen size={18} /> Focus
          </button>
          <button 
            onClick={() => switchMode("break")}
            className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all ${mode === "break" ? "bg-green-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}
          >
            <Coffee size={18} /> Break
          </button>
        </div>

        <div className="relative flex items-center justify-center w-64 h-64 rounded-full bg-white shadow-inner border-8 border-white mb-8">
          <div className={`absolute inset-0 rounded-full border-4 ${mode === 'focus' ? 'border-blue-500' : 'border-green-500'} opacity-20`}></div>
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="124"
              fill="transparent"
              stroke={mode === 'focus' ? '#3b82f6' : '#22c55e'}
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 124}
              strokeDashoffset={2 * Math.PI * 124 * (1 - timeLeft / (mode === 'focus' ? FOCUS_TIME : BREAK_TIME))}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className={`text-6xl font-black tracking-tighter ${mode === 'focus' ? 'text-blue-900' : 'text-green-900'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={toggleTimer}
            className={`flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${mode === 'focus' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isActive ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button 
            onClick={resetTimer}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-white text-gray-500 shadow-md hover:bg-gray-50 transition-transform hover:scale-105 active:scale-95"
          >
            <RotateCcw size={24} />
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="p-8 w-full md:w-1/2 bg-gray-900 text-white flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <BarChart2 className="text-blue-400" /> Study Analytics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Focus Sessions</p>
              <p className="text-3xl font-black text-blue-400">{sessionsCompleted}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Total Time</p>
              <p className="text-3xl font-black text-green-400">{totalFocusMinutes} <span className="text-lg text-gray-500 font-medium lowercase">min</span></p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4">Weekly Habits</p>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-1 gap-2 group">
                <div className="relative w-full h-full flex items-end bg-gray-800 rounded-t-md overflow-hidden">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md transition-all duration-1000"
                    style={{ height: `${(data.mins / maxWeeklyMins) * 100}%` }}
                  ></div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {data.mins} min
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">{data.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
    </div>
  );
}
