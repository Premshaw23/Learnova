"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import SmartNoticeBoard from "@/components/SmartNoticeBoard";

const Notice = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not logged in or not verified
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else if (!user.emailVerified) {
        router.push("/verify");
      }
    }
  }, [authLoading, user, router]);

  // While checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <span className="w-5 h-5 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin mr-3"></span>
        <span className="text-indigo-300 text-xl">
          Checking authentication...
        </span>
      </div>
    );
  }

  // If no user, return null (wait until redirect happens)
  if (!user) return null;

  // ✅ Authenticated and verified
  return (
    <div className="min-h-screen bg-slate-900">
      <SmartNoticeBoard />
    </div>
  );
};

export default Notice;
