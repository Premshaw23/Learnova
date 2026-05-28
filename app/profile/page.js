"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import ProfilePage from "@/components/Profile";

const Profile = () => {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in → go to auth
        router.push("/auth");
      } else if (!user.emailVerified) {
        // Logged in but not verified → go to verify page
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

  if (!user || !user.emailVerified) return null; // avoid flicker

  // ✅ Authenticated + Verified user
  return <ProfilePage />;
};

export default Profile;
