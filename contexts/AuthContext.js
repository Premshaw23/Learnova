"use client";
import { createContext, useContext } from "react";
import { useAuth as useFirebaseAuth } from "@/hooks/useAuth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useFirebaseAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
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
