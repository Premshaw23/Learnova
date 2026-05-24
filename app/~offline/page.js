"use client";

import React, { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Home, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

export default function OfflineFallback() {
  const [isRetrying, setIsRetrying] = useState(false);

  // Auto-reload when back online
  useEffect(() => {
    const handleOnline = () => {
      window.location.reload();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
      setIsRetrying(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background blobs for Learnova branded look */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 max-w-lg w-full shadow-2xl text-center z-10">
        <div className="w-24 h-24 bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner">
          <WifiOff className="w-12 h-12 text-gray-400" />
        </div>

        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          You're Offline
        </h1>
        
        <p className="text-gray-400 mb-8 text-lg">
          It looks like you've lost your internet connection. We'll automatically reconnect you when your network returns.
        </p>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl mb-8"
        >
          <RefreshCw className={`w-5 h-5 ${isRetrying ? "animate-spin" : ""}`} />
          <span>{isRetrying ? "Retrying..." : "Try Again"}</span>
        </button>

        <div className="border-t border-white/10 pt-8">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-6">
            Cached Pages Available Offline
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <Link href="/" className="flex flex-col items-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/50 border border-white/5 transition-colors group">
              <Home className="w-6 h-6 text-gray-400 group-hover:text-blue-400 mb-2 transition-colors" />
              <span className="text-xs text-gray-400 group-hover:text-gray-200">Home</span>
            </Link>
            <Link href="/student/dashboard" className="flex flex-col items-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/50 border border-white/5 transition-colors group">
              <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-purple-400 mb-2 transition-colors" />
              <span className="text-xs text-gray-400 group-hover:text-gray-200">Dashboard</span>
            </Link>
            <Link href="/attendance" className="flex flex-col items-center p-3 rounded-xl bg-gray-800/40 hover:bg-gray-700/50 border border-white/5 transition-colors group">
              <Clock className="w-6 h-6 text-gray-400 group-hover:text-green-400 mb-2 transition-colors" />
              <span className="text-xs text-gray-400 group-hover:text-gray-200">Attendance</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
