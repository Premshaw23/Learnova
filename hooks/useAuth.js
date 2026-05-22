import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { onIdTokenChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/**
 * Provides authentication state and user profile information.
 * Tracks Firebase authentication changes and exposes auth-related utilities.
 * @returns {Object} Authentication state, user profile data, loading state, errors, and helper methods.
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
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Sync token to cookie
          const idToken = await firebaseUser.getIdToken();
          await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });

          // Get user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));

          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUser(firebaseUser);
            setUserProfile(profileData);
          } else {
            // User exists in Auth but no profile in Firestore
            setUser(firebaseUser);
            setUserProfile(null);
          }
        } else {
          setUser(null);
          setUserProfile(null);
          
          // Clear cookie
          await fetch("/api/auth/session", {
            method: "DELETE",
          });
        }

        setError(null);
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
        setUser(null);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
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
    } catch (err) {
      console.error("Sign out error:", err);
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
