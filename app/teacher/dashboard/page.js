"use client";

import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import RouteLoading from "@/components/RouteLoading";

const TeacherDashboard = dynamic(
  () => import("@/components/TeacherDashboardComponent "),
  {
    loading: () => <RouteLoading />,
  }
);

export default function Teacher() {
  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <TeacherDashboard />
    </ProtectedRoute>
  );
}
