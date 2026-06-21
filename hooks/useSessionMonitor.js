"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export function useSessionMonitor() {
  const { signOut } = useAuth();
  const router = useRouter();
  const isIntercepting = useRef(false);
  const isSessionExpired = useRef(false); //  local ref — no window pollution
  const resetTimerRef = useRef(null); //  store timer ID so we can cancel it

  useEffect(() => {
    if (typeof window === "undefined" || isIntercepting.current) return;

    isIntercepting.current = true;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      const requestUrl =
        typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const isOwnApi =
        requestUrl.startsWith("/api/") ||
        (typeof window !== "undefined" &&
          requestUrl.startsWith(window.location.origin + "/api/"));

      if (!isOwnApi) return response;

      if (response.status === 401) {
        if (!isSessionExpired.current) {
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
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
      isIntercepting.current = false;
      isSessionExpired.current = false; //  always reset on unmount

      if (resetTimerRef.current) {
        //  cancel pending timer on unmount
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    };
  }, [signOut, router]);
}
