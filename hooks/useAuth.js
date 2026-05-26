"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

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

const deleteCookie = (name) => {
  if (typeof window !== "undefined") {
    const isSecure = process.env.NODE_ENV === "production";
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  }
};

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
 * hasProfile: boolean
 * }} Authentication state and helper methods.
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous snapshot listener if active
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      try {
        if (firebaseUser) {
          setUser(firebaseUser);

          // Listen to the user profile document in real-time
          const userDocRef = doc(db, "users", firebaseUser.uid);
          unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
            try {
              if (userDoc.exists()) {
                const profileData = userDoc.data();
                setUserProfile(profileData);

                // Sync auth token and role in cookies
                const token = await firebaseUser.getIdToken();
                setCookie("authToken", token, 7);
                setCookie("userRole", profileData.role, 7);
              } else {
                // User exists in Auth but no profile in Firestore yet
                setUserProfile(null);
                deleteCookie("authToken");
                deleteCookie("userRole");
              }
              setLoading(false);
            } catch (snapErr) {
              console.error("Error in profile snapshot listener:", snapErr);
              setError(snapErr.message);
              setLoading(false);
            }
          }, (snapError) => {
            console.warn("Profile snapshot subscription error:", snapError.message);
            // Handle permission denied or other errors gracefully without locking loading state
            setLoading(false);
          });
        } else {
          setUser(null);
          setUserProfile(null);

          // Clear auth cookies
          deleteCookie("authToken");
          deleteCookie("userRole");

          // Clear PWA caches on logout to prevent data leakage on shared devices
          if (typeof window !== "undefined" && "caches" in window) {
            try {
              const cacheKeys = await caches.keys();
              await Promise.all(
                cacheKeys.map((key) => caches.delete(key))
              );
            } catch (cacheErr) {
              console.warn("Failed to clear PWA caches on auth state change:", cacheErr);
            }
          }
          setLoading(false);
        }

        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
        setUserProfile(null);
        deleteCookie("authToken");
        deleteCookie("userRole");
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  /**
   * Signs out the currently authenticated user and clears local auth state.
   * @returns {Promise<void>} Resolves when the user is successfully signed out.
   */
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);

      // Critical Security Fix: Clear authentication cookies to prevent zombie sessions in Next.js middleware
      deleteCookie("authToken");
      deleteCookie("userRole");

      // Clear all PWA caches to prevent cached API responses from persisting after logout
      if (typeof window !== "undefined" && "caches" in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(
            cacheKeys.map((key) => caches.delete(key))
          );
        } catch (cacheErr) {
          console.warn("Failed to clear PWA caches on sign out:", cacheErr);
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    user,
    userProfile,
    loading,
    error,
    signOut,
    isAuthenticated: !!user,
    hasProfile: !!userProfile,
  };
};