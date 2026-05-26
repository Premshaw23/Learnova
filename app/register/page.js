"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import RegisterPage from "@/components/register";

const Register = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Not logged in → go to login
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-indigo-300 text-lg font-medium animate-pulse">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) return null; // avoid flash before redirect

  // ✅ Authenticated + Verified
  return <RegisterPage />;
};

export default Register;
