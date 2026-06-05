"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// ============================================================================
// 🚀 ROLE-BASED CODE SPLITTING (Issue #3257)
// ============================================================================
// By dynamically importing these here, a Student will NEVER download the
// TeacherDashboard code chunk, saving massive amounts of bandwidth and FCP time.

const StudentDashboard = dynamic(
  () => import("@/components/StudentDashboard"),
  { 
    ssr: false, 
    loading: () => <DashboardSkeleton /> 
  }
);

// Assuming you have a TeacherDashboard component. If it's named differently, adjust the path!
const TeacherDashboard = dynamic(
  () => import("@/components/TeacherDashboard"), 
  { 
    ssr: false, 
    loading: () => <DashboardSkeleton /> 
  }
);

export default function UnifiedDashboardRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <ProtectedRoute>
      {/* Dynamically render the correct dashboard based on the user's auth token role.
        The browser will only fetch the JS chunk for the component that actually mounts!
      */}
      {user?.role === "teacher" || user?.role === "admin" ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
    </ProtectedRoute>
  );
}