"use client";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const StudentDashboard = dynamic(
  () => import("@/components/StudentDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function Student() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  );
}