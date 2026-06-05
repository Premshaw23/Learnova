"use client";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
const AUTH_TIMEOUT = 15000;

export default function ProtectedRoute({
  children,
  allowedRoles = null,
  requireEmailVerification = true,
}) {
  const { user, userProfile, loading, isAuthenticated, hasProfile } =
    useAuthContext();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      setAuthTimedOut(true);
    }, AUTH_TIMEOUT);

    return () => clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (authTimedOut) {
      safeRedirect("/auth");
      return;
    }

    if (loading) return;

    if (!isAuthenticated) {
      safeRedirect("/auth");
      return;
    }

    if (requireEmailVerification && user && !user.emailVerified) {
      safeRedirect("/verify");
      return;
    }

    if (isAuthenticated && !hasProfile) {
      safeRedirect("/profile");
      return;
    }

    if (
      allowedRoles &&
      userProfile &&
      !allowedRoles.includes(userProfile.role)
    ) {
      toast.error(
        "Access Denied: You do not have permission to view this page."
      );
      let target = "/auth";
      switch (userProfile.role) {
        case "student":
          target = "/student/dashboard";
          break;
        case "teacher":
          target = "/teacher/dashboard";
          break;
        case "institute":
          target = "/institute/dashboard";
          break;
        case "admin":
          target = "/admin/dashboard";
          break;
        case "parent":
          target = "/parent/dashboard";
          break;
      }
      safeRedirect(target);
      return;
    }
  }, [
    user,
    userProfile,
    loading,
    isAuthenticated,
    hasProfile,
    requireEmailVerification,
    allowedRoles,
    authTimedOut,
  ]);

  const safeRedirect = (target) => {
    if (pathname !== target) {
      setRedirecting(true);
      router.push(target);
    }
  };

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-[#050816] text-white p-6 animate-pulse">
        {/* Navbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="h-12 w-44 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/10"></div>

          <div className="flex gap-4">
            <div className="h-10 w-24 rounded-xl bg-gray-800/70"></div>
            <div className="h-10 w-24 rounded-xl bg-gray-800/70"></div>
            <div className="h-10 w-24 rounded-xl bg-gray-800/70"></div>
          </div>

          <div className="h-12 w-12 rounded-full bg-blue-900/40"></div>
        </div>

        {/* Profile Card */}
        <div className="rounded-3xl border border-blue-500/10 bg-[#0B1120]/80 backdrop-blur-xl p-6 mb-8 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
          <div className="flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="h-20 w-20 rounded-2xl bg-blue-900/40"></div>

              <div>
                <div className="h-8 w-48 rounded-lg bg-gray-700 mb-3"></div>
                <div className="h-4 w-64 rounded bg-gray-800"></div>
              </div>
            </div>

            <div className="text-right">
              <div className="h-8 w-20 rounded bg-gray-700 mb-2"></div>
              <div className="h-4 w-16 rounded bg-gray-800"></div>
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="h-10 w-36 rounded-xl bg-blue-900/40"></div>
            <div className="h-4 w-32 rounded bg-gray-800"></div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Overview */}
            <div className="rounded-3xl bg-[#0B1120]/80 border border-blue-500/10 p-6">
              <div className="h-8 w-64 rounded bg-gray-700 mb-8"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-28 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-white/5"
                  ></div>
                ))}
              </div>

              <div className="h-4 w-48 rounded bg-gray-700 mb-4"></div>

              <div className="w-full h-5 rounded-full bg-gray-800 overflow-hidden">
                <div className="h-full w-[75%] bg-gradient-to-r from-green-400 via-cyan-400 to-blue-500 rounded-full"></div>
              </div>

              <div className="h-4 w-40 rounded bg-gray-800 mt-3"></div>
            </div>

            {/* Recent Activity */}
            <div className="rounded-3xl bg-[#0B1120]/80 border border-blue-500/10 p-6">
              <div className="h-8 w-56 rounded bg-gray-700 mb-6"></div>

              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Classes */}
            <div className="rounded-3xl bg-[#0B1120]/80 border border-blue-500/10 p-6 h-72">
              <div className="h-8 w-48 rounded bg-gray-700 mb-10"></div>

              <div className="flex flex-col items-center justify-center h-[70%]">
                <div className="h-20 w-20 rounded-2xl bg-gray-800 mb-6"></div>
                <div className="h-4 w-48 rounded bg-gray-800"></div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-3xl bg-[#0B1120]/80 border border-blue-500/10 p-6">
              <div className="h-8 w-40 rounded bg-gray-700 mb-6"></div>

              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-900/40"></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 rounded bg-gray-700 mb-2"></div>
                      <div className="h-3 w-20 rounded bg-gray-800"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If redirect conditions triggered, don’t render children
  if (!isAuthenticated || !hasProfile) return null;
  if (requireEmailVerification && user && !user.emailVerified) return null;
  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role))
    return null;

  // ✅ Allowed → show children
  return children;
}
