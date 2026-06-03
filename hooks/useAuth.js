"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onIdTokenChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot, getDoc } from "firebase/firestore";
import { getClientCsrfToken } from "@/lib/csrf";
import { useIsMounted } from "./useIsMounted";

/**
 * Cookie utility helpers for writing/deleting client cookies
 */
const setCookie = (name, value, days = 7) => {
  if (typeof window !== "undefined") {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const isSecure = process.env.NODE_ENV === "production";
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }
};

const AUTH_TOKEN_COOKIE_DURATION_HOURS = 1;

const syncAuthTokenCookie = async (token) => {
  if (!token || typeof window === "undefined") {
    return;
  }

  await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(getClientCsrfToken() ? { "X-CSRF-Token": getClientCsrfToken() } : {}),
    },
    credentials: "same-origin",
  }).catch((error) => {
    console.warn(
      "[useAuth] Failed to sync auth session cookie:",
      error?.message
    );
  });
};

const deleteCookie = (name) => {
  if (typeof window !== "undefined") {
    const isSecure = process.env.NODE_ENV === "production";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }
};

const clearAuthSessionCookie = async () => {
  if (typeof window === "undefined") {
    return;
  }

  await fetch("/api/auth/session", {
    method: "DELETE",
    headers: {
      ...(getClientCsrfToken() ? { "X-CSRF-Token": getClientCsrfToken() } : {}),
    },
    credentials: "same-origin",
  }).catch((error) => {
    console.warn(
      "[useAuth] Failed to clear auth session cookie:",
      error?.message
    );
  });
};

const AUTH_SENSITIVE_CACHE_PATTERNS = [
  /auth/i,
  /user/i,
  /session/i,
  /token/i,
  /profile/i,
  /secure/i,
];

export const clearAuthSensitiveCaches = async () => {
  const cacheStorage = globalThis?.caches;
  if (!cacheStorage) return;

  try {
    const cacheKeys = await cacheStorage.keys();
    const authCacheKeys = cacheKeys.filter((key) =>
      AUTH_SENSITIVE_CACHE_PATTERNS.some((pattern) => pattern.test(key))
    );

    await Promise.all(authCacheKeys.map((key) => cacheStorage.delete(key)));
  } catch (cacheErr) {
    // Failed to clear caches; silently ignore to avoid leaking sensitive info to console
  }
};

// ─── Token Refresh Resilience ───────────────────────────────────────────────

const MAX_REFRESH_RETRIES = 5;
const REFRESH_BASE_DELAY_MS = 30 * 1000; // 30 seconds
const REFRESH_INTERVAL_MS = 55 * 60 * 1000; // 55 minutes

/**
 * Creates a token refresh function with exponential backoff retry logic.
 * After MAX_REFRESH_RETRIES consecutive failures, triggers a session-expired
 * event so the UI can notify the user.
 */
function createTokenRefreshManager(firebaseUser, onSessionExpired) {
  let consecutiveFailures = 0;
  let refreshTimer = null;

  async function attemptRefresh() {
    try {
      const freshToken = await firebaseUser.getIdToken(true);
      await syncAuthTokenCookie(freshToken);
      consecutiveFailures = 0;
    } catch (tokenError) {
      consecutiveFailures++;

      if (consecutiveFailures >= MAX_REFRESH_RETRIES) {
        console.error(
          "[useAuth] Token refresh failed after max retries. Session may be expired."
        );
        if (onSessionExpired) {
          onSessionExpired();
        }
      }
    }
  }

  function start() {
    stop();
    refreshTimer = setInterval(attemptRefresh, REFRESH_INTERVAL_MS);
  }

  function stop() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    consecutiveFailures = 0;
  }

  function refreshNow() {
    return attemptRefresh();
  }

  return { start, stop, refreshNow };
}

/**
 * Provides authentication state and user profile information.
 * Tracks Firebase authentication changes and exposes auth-related utilities.
 * @returns {{
 * user: Object|null,
 * userProfile: Object|null,
 * loading: boolean,
 * error: string|null,
 * signOut: Function,
 * isAuthenticated: boolean,
 * hasProfile: boolean,
 * sessionExpired: boolean
 * }} Authentication state and helper methods.
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refreshManagerRef = useRef(null);
  const unsubscribeSnapshotRef = useRef(null);
  const isMounted = useIsMounted();

  const handleSessionExpired = useCallback(() => {
    if (!isMounted()) return;
    setSessionExpired(true);
    setError("Your session has expired. Please sign in again.");
  }, [isMounted]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      // Clean up previous snapshot listener and token refresh if active
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
        refreshManagerRef.current = null;
      }

      setSessionExpired(false);

      try {
        if (firebaseUser) {
          if (isMounted()) {
            setUser(firebaseUser);
          }

          // Create a new token refresh manager with exponential backoff retry
          refreshManagerRef.current = createTokenRefreshManager(
            firebaseUser,
            handleSessionExpired
          );
          refreshManagerRef.current.start();

          // Listen to the user profile document in real-time for profile data
          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubscribeSnapshotRef.current = onSnapshot(
            userDocRef,
            async (userDoc) => {
              try {
                if (userDoc.exists()) {
                  const profileData = userDoc.data();
                  if (isMounted()) setUserProfile(profileData);

                  // Sync auth token cookie
                  const token = await firebaseUser.getIdToken();
                  await syncAuthTokenCookie(token);

                  // Read role from JWT custom claims (authoritative source)
                  // instead of Firestore to prevent role mismatch during async claim propagation
                  const idTokenResult = await firebaseUser.getIdTokenResult();
                  const claimsRole = idTokenResult.claims?.role;
                  if (claimsRole) {
                    setCookie("userRole", claimsRole, 7);
                  }
                } else {
                  if (isMounted()) setUserProfile(null);
                  await clearAuthSessionCookie();
                  deleteCookie("authToken");
                  deleteCookie("userRole");
                }
                if (isMounted()) setLoading(false);
              } catch (snapErr) {
                console.error("Error in profile snapshot listener:", snapErr);
                if (isMounted()) {
                  setError(snapErr.message);
                  setLoading(false);
                }
              }
            },
            (snapError) => {
              if (isMounted()) setLoading(false);
            }
          );
        } else {
          if (isMounted()) {
            setUser(null);
            setUserProfile(null);
          }

          // Clear auth cookies
          await clearAuthSessionCookie();
          deleteCookie("authToken");
          deleteCookie("userRole");

          await clearAuthSensitiveCaches();
          if (isMounted()) setLoading(false);
        }

        if (isMounted()) setError(null);
      } catch (err) {
        if (isMounted()) {
          setError(err.message);
          setUser(null);
          setUserProfile(null);
        }
        await clearAuthSessionCookie();
        deleteCookie("authToken");
        deleteCookie("userRole");
        if (isMounted()) setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
        refreshManagerRef.current = null;
      }
    };
  }, [handleSessionExpired]);

  /**
   * Signs out the currently authenticated user and clears local auth state.
   * @returns {Promise<void>} Resolves when the user is successfully signed out.
   */
  const signOut = async () => {
    try {
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
        refreshManagerRef.current = null;
      }
      await clearAuthSessionCookie();
      await firebaseSignOut(auth);
      if (isMounted()) {
        setUser(null);
        setUserProfile(null);
        setSessionExpired(false);
      }

      // Critical Security Fix: Clear authentication cookies to prevent zombie sessions in Next.js middleware
      deleteCookie("userRole");

      await clearAuthSensitiveCaches();
    } catch (err) {
      if (isMounted()) setError(err.message);
    }
  };

  /**
   * Forces an immediate token refresh (e.g., after a role change).
   */
  const forceTokenRefresh = useCallback(async () => {
    if (refreshManagerRef.current) {
      await refreshManagerRef.current.refreshNow();
    }
  }, []);

  return {
    user,
    userProfile,
    loading,
    error,
    signOut,
    forceTokenRefresh,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    sessionExpired,
  };
};
