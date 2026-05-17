"use client";

import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteLoading from "@/components/RouteLoading";

const StudentDashboard = dynamic(
  () => import("@/components/StudentDashboard"),
  {
    loading: () => <RouteLoading />,
  }
);

export default function Student() {
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboard />
    </ProtectedRoute>
  );
}
