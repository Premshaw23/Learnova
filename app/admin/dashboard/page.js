"use client";

import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteLoading from "@/components/RouteLoading";

const SuperAdminDashboard = dynamic(
  () => import("@/components/AdminDashboard"),
  {
    loading: () => <RouteLoading />,
  }
);

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SuperAdminDashboard />
    </ProtectedRoute>
  );
}
