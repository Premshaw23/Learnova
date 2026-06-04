"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/apiClient";


const ROLE_CHECK_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

/**
 * Hook that periodically checks if the user's JWT role is in sync with
 * the authoritative Firestore role. If a mismatch is detected, forces
 * a token refresh to update the JWT custom claims.
 *
 * This resolves the middleware/API role desynchronization issue where
 * Firebase custom claims can be stale for up to 1 hour after a role change.
 *
 * Usage:
 *   useRoleSync(); // Call once in a top-level layout or dashboard component
 */
export function useRoleSync() {
  const { user, forceTokenRefresh, isAuthenticated } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    async function checkRoleSync() {
      try {
        const token = await user.getIdToken();
        const response = await apiFetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data = await response.json();

        // If Firestore role differs from JWT role, force a token refresh
        if (data.role !== data.jwtRole) {
          console.info("[useRoleSync] Role mismatch detected, forcing token refresh");
          await forceTokenRefresh();
        }
      } catch {
        // Silently ignore — the check is best-effort
      }
    }

    // Check immediately on mount
    checkRoleSync();

    // Then check periodically
    intervalRef.current = setInterval(checkRoleSync, ROLE_CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user, forceTokenRefresh, isAuthenticated]);
}
