"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import ProfilePage from "@/components/profile";
import ProfileSkeleton from "@/components/skeletons/ProfileSkeleton";

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
    return <ProfileSkeleton />;
  }

  if (!user || !user.emailVerified) return null; // avoid flicker

  // ✅ Authenticated + Verified user
  return <ProfilePage />;
};

export default Profile;
