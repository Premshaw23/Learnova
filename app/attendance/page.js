"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import AttendanceValidation from "@/components/AttendanceValidation";
import { Navbar } from "@/components/Navbar";
import useLabels from "@/components/useLabels";
import { useAuth } from "@/hooks/useAuth";

const FaceRecognizer = dynamic(() => import("@/components/FaceRecognizer"), {
  ssr: false,
});

const AttendancePage = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    labels,
    loading: labelsLoading,
    error: labelsError,
  } = useLabels(user);
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState("validation"); // 'validation' or 'recognition'
  const [validationComplete, setValidationComplete] = useState(false);

  // Redirect unauthenticated or unverified users
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth");
      } else if (!user.emailVerified) {
        router.push("/verify");
      }
    }
  }, [authLoading, user, router]);

  // Handle validation success
  const handleValidationSuccess = () => {
    setValidationComplete(true);
    setCurrentStep("recognition");
  };

  // Handle back to validation
  const handleBackToValidation = () => {
    setCurrentStep("validation");
    setValidationComplete(false);
  };

  // While checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <span className="text-purple-300 text-xl font-medium">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null; // wait for redirect

  // Loading labels
  if (labelsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center pt-32 space-x-4">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <span className="text-purple-300 text-xl font-medium">
            Loading student database...
          </span>
        </div>
      </div>
    );
  }

  // Error loading labels
  if (labelsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center mt-32 space-y-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400">
            Database Connection Error
          </h2>
          <p className="text-gray-400 text-center max-w-md">
            Unable to load student database. Please check your connection and
            try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-2xl hover:bg-red-600/30 transition-all duration-300 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry Connection
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Check if no students are registered
  if (!labels || labels.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center mt-32 space-y-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-yellow-400">
            No Students Registered
          </h2>
          <p className="text-gray-400 text-center max-w-md">
            No students have been registered in the system yet. Register some
            students first to use the attendance system.
          </p>
          <button
            onClick={() => router.push("/register")}
            className="px-6 py-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-2xl hover:bg-purple-600/30 transition-all duration-300 backdrop-blur-sm"
          >
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Register Students
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
      <Navbar />

      {currentStep === "validation" ? (
        <div className="pt-16">
          <AttendanceValidation onValidationSuccess={handleValidationSuccess} />
        </div>
      ) : (
        <div className="pt-16">
          <FaceRecognizer authUser={user} />
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
