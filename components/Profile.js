"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { User, AlertTriangle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UniversalProfile from "@/components/universal-profile";

export default function ProfilePage() {
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "profile" });
    }
  }, []);

  const { user, loading } = useAuth();
  // Removed extensive unused mock data (achievements, stats, recentActivity) and unused state handlers

  // Show loading prompt
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-gradient-to-r from-accent to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Please Log In</h2>
            <p className="text-gray-400">
              You need to be logged in to view your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 pt-20">
      <UniversalProfile />
    </div>
  );
}
