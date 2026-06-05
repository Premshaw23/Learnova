"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const setCookie = (name, value, days = 7) => {
  if (typeof window !== "undefined") {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const isSecure = process.env.NODE_ENV === "production";
    document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }
};

const AUTH_TOKEN_COOKIE_DURATION_HOURS = 1;

const setAuthTokenCookie = (token) => {
  setCookie("authToken", token, AUTH_TOKEN_COOKIE_DURATION_HOURS / 24);
};

const deleteCookie = (name) => {
  if (typeof window !== "undefined") {
    const isSecure = process.env.NODE_ENV === "production";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }
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
    console.warn("Failed to clear auth-sensitive caches:", cacheErr);
  }
};

const MAX_REFRESH_RETRIES = 5;
const REFRESH_INTERVAL_MS = 55 * 60 * 1000;

function createTokenRefreshManager(firebaseUser, onSessionExpired) {
  let consecutiveFailures = 0;
  let refreshTimer = null;

  async function attemptRefresh() {
    try {
      const freshToken = await firebaseUser.getIdToken(true);
      setAuthTokenCookie(freshToken);
      consecutiveFailures = 0;
    } catch (tokenError) {
      consecutiveFailures++;
      console.warn(
        `[useAuth] Token refresh failed (attempt ${consecutiveFailures}/${MAX_REFRESH_RETRIES}):`,
        tokenError?.message
      );
      if (consecutiveFailures >= MAX_REFRESH_RETRIES) {
        console.error("[useAuth] Token refresh failed after max retries. Session may be expired.");
        if (onSessionExpired) onSessionExpired();
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
 *
 * Fix for Issue #2181 — Race condition on hard refresh
 * ─────────────────────────────────────────────────────
 * Root cause: `loading` was set to false as soon as Firebase Auth resolved,
 * before the first Firestore profile snapshot fired. ProtectedRoute saw
 * (authenticated=true, profile=null, loading=false) and incorrectly
 * redirected the user to /auth or /register.
 *
 * Fix: Split loading into two flags:
 *   - firebaseLoading: true until onAuthStateChanged fires once
 *   - profileLoading:  true from when a Firebase user is confirmed until
 *                      the FIRST Firestore snapshot resolves
 *
 * The exported `loading` = firebaseLoading || profileLoading, so
 * ProtectedRoute only makes redirect decisions after BOTH have resolved.
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const refreshManagerRef = useRef(null);
  const unsubscribeSnapshotRef = useRef(null);
  const firstSnapshotReceivedRef = useRef(false);

  const handleSessionExpired = useCallback(() => {
    if (!isMounted()) return;
    setSessionExpired(true);
    setError("Your session has expired. Please sign in again.");
  }, [isMounted]);

  useEffect(() => {
    if (!auth) {
      setFirebaseLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshotRef.current) {
        unsubscribeSnapshotRef.current();
        unsubscribeSnapshotRef.current = null;
      }
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
        refreshManagerRef.current = null;
      }

      firstSnapshotReceivedRef.current = false;
      setSessionExpired(false);

      try {
        if (firebaseUser) {
          if (isMounted()) {
            setUser(firebaseUser);
          }

          // KEY FIX: set profileLoading=true BEFORE subscribing to Firestore
          // so ProtectedRoute sees loading=true during the async window and
          // never redirects an authenticated user with a pending profile fetch.
          setProfileLoading(true);

          refreshManagerRef.current = createTokenRefreshManager(
            firebaseUser,
            handleSessionExpired
          );
          refreshManagerRef.current.start();

          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubscribeSnapshotRef.current = onSnapshot(
            userDocRef,
            async (userDoc) => {
              try {
                if (userDoc.exists()) {
                  const profileData = userDoc.data();
                  setUserProfile(profileData);
                  const token = await firebaseUser.getIdToken();
                  setAuthTokenCookie(token);
                  setCookie("userRole", profileData.role, 7);
                } else {
                  setUserProfile(null);
                  deleteCookie("authToken");
                  deleteCookie("userRole");
                }
              } catch (snapErr) {
                console.error("Error in profile snapshot listener:", snapErr);
                setError(snapErr.message);
              } finally {
                // Only flip profileLoading→false on the FIRST snapshot
                if (!firstSnapshotReceivedRef.current) {
                  firstSnapshotReceivedRef.current = true;
                  setProfileLoading(false);
                }
              }
            },
            (snapError) => {
              console.warn("Profile snapshot subscription error:", snapError.message);
              if (!firstSnapshotReceivedRef.current) {
                firstSnapshotReceivedRef.current = true;
                setProfileLoading(false);
              }
            }
          );
        } else {
          setUser(null);
          setUserProfile(null);
          setProfileLoading(false);
          deleteCookie("authToken");
          deleteCookie("userRole");
          await clearAuthSensitiveCaches();
        }

        if (isMounted()) setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
        setUserProfile(null);
        setProfileLoading(false);
        deleteCookie("authToken");
        deleteCookie("userRole");
      } finally {
        setFirebaseLoading(false);
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

  const signOut = async () => {
    try {
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
        refreshManagerRef.current = null;
      }
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setSessionExpired(false);
      deleteCookie("authToken");
      deleteCookie("userRole");
      await clearAuthSensitiveCaches();
    } catch (err) {
      if (isMounted()) setError(err.message);
    }
  };

  const forceTokenRefresh = useCallback(async () => {
    if (refreshManagerRef.current) {
      await refreshManagerRef.current.refreshNow();
    }
  }, []);

  return {
    user,
    userProfile,
    // loading = true until BOTH Firebase Auth AND first Firestore snapshot
    // have resolved — this is the core fix for issue #2181
    loading: firebaseLoading || profileLoading,
    error,
    signOut,
    forceTokenRefresh,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
    sessionExpired,
  };
};
