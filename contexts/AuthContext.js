"use client";
import { createContext, useContext } from "react";
import { useAuth as useFirebaseAuth } from "@/hooks/useAuth";

import { hasPermission as checkPermission } from "@/constants/permissions";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useFirebaseAuth();

  const userRole = auth.userProfile?.role || null;
  const hasPermission = (permission) => {
    return checkPermission(userRole, permission);
  };

  const contextValue = {
    ...auth,
    userRole,
    hasPermission,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}

export function useAuth() {
  return useAuthContext();
}
