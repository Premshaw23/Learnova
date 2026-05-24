// app/admin/dashboard/page.jsx
"use client";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const SuperAdminDashboard = dynamic(
  () => import("@/components/AdminDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SuperAdminDashboard/>
    </ProtectedRoute>
  );
}
