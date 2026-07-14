"use client";

import { createContext, useContext, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { setSessionExpiredHandler } from "@/lib/apiClient";

const SessionAwareFetchContext = createContext(null);

function useSessionExpiredHandler() {
  const { signOut } = useAuth();
  const router = useRouter();
  const isSessionExpired = useRef(false);
  const resetTimerRef = useRef(null);

  return useCallback(async () => {
    if (isSessionExpired.current) return;
    isSessionExpired.current = true;

    toast.error("Session expired. Please log in again.");

    try {
      await signOut();
    } catch (e) {
      console.error("Error during auto-signout:", e);
    }

    router.push("/auth");

    resetTimerRef.current = setTimeout(() => {
      isSessionExpired.current = false;
      resetTimerRef.current = null;
    }, 5000);
  }, [signOut, router]);
}

export function SessionAwareFetchProvider({ children }) {
  const handleSessionExpired = useSessionExpiredHandler();

  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  return (
    <SessionAwareFetchContext.Provider value={null}>
      {children}
    </SessionAwareFetchContext.Provider>
  );
}

export function useSessionAwareFetch() {
  return useContext(SessionAwareFetchContext);
}

export function useSessionMonitor() {
  return null;
}
