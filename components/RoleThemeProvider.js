"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function RoleThemeProvider({ children }) {
  const { userProfile, loading } = useAuth();

  useEffect(() => {
    if (!loading && userProfile?.role) {
      document.documentElement.setAttribute(
        "data-role-theme",
        userProfile.role
      );
    } else {
      document.documentElement.removeAttribute("data-role-theme");
    }
  }, [userProfile?.role, loading]);

  return <>{children}</>;
}
