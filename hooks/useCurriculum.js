"use client";

import { useState } from "react";

// No curriculum data fetching exists in StudentDashboard, TeacherDashboardComponent,
// or InstituteDashboard. All curriculum content in the app is static (constants/mockData).
// This hook is a documented stub ready for future implementation.
export const useCurriculum = ({ role, user } = {}) => {
  const [curriculum] = useState(null);

  return {
    curriculum,
    loading: false,
    error: null,
    refetch: () => {},
  };
};
