"use client";

import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const ParentDashboard = dynamic(
  () => import("@/components/ParentDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function ParentDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["parent"]}>
      <ParentDashboard />
    </ProtectedRoute>
  );
}
