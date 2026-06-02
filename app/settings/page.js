"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import SettingsPage from "@/components/Settings";

const Settings = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in → redirect to /auth
        router.push("/auth");
      } else if (!user.emailVerified) {
        // Logged in but not verified → redirect to /verify
        router.push("/verify");
      }
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="text-indigo-300 text-xl animate-pulse">
          Checking authentication...
        </span>
      </div>
    );
  }
  

  // Prevent flash before redirect
  if (!user || !user.emailVerified) return null;

  // ✅ Authenticated + Verified
  return <SettingsPage />;
};

export default Settings;
