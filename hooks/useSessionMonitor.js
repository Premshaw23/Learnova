"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export function useSessionMonitor() {
  const { signOut } = useAuth();
  const router = useRouter();
  const isIntercepting = useRef(false);

  useEffect(() => {
    // Only run in the browser and only attach once
    if (typeof window === "undefined" || isIntercepting.current) return;

    isIntercepting.current = true;
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      // Check for 401 Unauthorized
      // Only intercept our own API calls, not third-party requests
      const requestUrl =
        typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      const isOwnApi =
        requestUrl.startsWith("/api/") ||
        (typeof window !== "undefined" &&
          requestUrl.startsWith(window.location.origin + "/api/"));

      if (!isOwnApi) return response;

      // Only 401 Unauthorized indicates session expiry.
      // 403 Forbidden is used for RBAC, CSRF, and other non-session errors.
      if (response.status === 401) {
        // Prevent multiple toasts/redirects if multiple requests fail simultaneously
        if (!window.__sessionExpired) {
          window.__sessionExpired = true;

          toast.error("Session expired. Please log in again.");

          try {
            await signOut();
          } catch (e) {
            console.error("Error during auto-signout:", e);
          }

          router.push("/auth");

          // Reset flag after a short delay allowing redirect to happen
          setTimeout(() => {
            window.__sessionExpired = false;
          }, 5000);
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
      isIntercepting.current = false;
    };
  }, [signOut, router]);
}
