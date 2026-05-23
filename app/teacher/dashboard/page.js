// app/teacher/dashboard/page.jsx
"use client";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const TeacherDashboard = dynamic(
  () => import("@/components/TeacherDashboardComponent"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function Teacher() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherDashboard/>
    </ProtectedRoute>
  );
}
