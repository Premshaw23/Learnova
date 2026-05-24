// app/institute/dashboard/page.jsx
"use client";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

const InstituteDashboard = dynamic(
  () => import("@/components/InstituteDashboard"),
  { ssr: false, loading: () => <DashboardSkeleton /> }
);

export default function Institute() {
  return (
    <ProtectedRoute allowedRoles={["institute"]}>
      <InstituteDashboard />
    </ProtectedRoute>
  );
}
