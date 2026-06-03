import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";
import {
  createUserProfile,
  getErrorMessage,
  validatePasswordStrength,
} from "@/utils/authUtils";
import { ROLE_CONFIG } from "@/constants/userRoles";

const FIREBASE_CONFIG_ERROR =
  "Firebase is not configured. Please add your Firebase environment variables to .env.local and restart the development server.";

const syncCustomClaims = async ({ user, role, fullName }) => {
  try {
    const token = await user.getIdToken();
    const response = await fetch("/api/auth/set-role", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role,
        fullName: fullName?.trim() || "",
      }),
    });

    if (response.ok) {
      // Force refresh token so the custom claims are present in the client-side session immediately
      await user.getIdToken(true).catch(() => {});
    } else {
      const errorData = await response.json().catch(() => ({}));
      if (errorData?.error?.includes("already registered")) {
        await user.getIdToken(true).catch(() => {});
      }
    }
  } catch {
    // Keep login non-blocking if claim migration fails.
  }
};

/**
 * Authenticates a user using email and password credentials.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} selectedRole - The role selected during login.
 * @returns {Promise<Object>} Authentication result and user data.
 */
export const loginWithEmail = async (email, password, selectedRole) => {
  try {
    if (!auth || !db) {
      return { success: false, error: FIREBASE_CONFIG_ERROR };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      return { success: false, needsVerification: true };
    }

    // Read role from Firebase custom claims (authoritative source)
    const idTokenResult = await user.getIdTokenResult();
    let userRole = idTokenResult.claims?.role;

    // If no custom claims yet, sync them from Firestore and refresh
    if (!userRole) {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role;
        await syncCustomClaims({
          user,
          role: userRole,
          fullName: userDoc.data().fullName,
        });
        const refreshed = await user.getIdTokenResult(true);
        userRole = refreshed.claims?.role || userRole;
      } else {
        return { success: false, needsProfile: true };
      }
    }

    if (userRole !== selectedRole) {
      await signOut(auth);
      return {
        success: false,
        error: `This account is registered as ${
          ROLE_CONFIG[userRole]?.title || "Unknown"
        }. Please select the correct role.`,
      };
    }

    // Update last login
    await setDoc(
      doc(db, "users", user.uid),
      {
        lastLogin: new Date(),
      },
      { merge: true }
    );

    return { success: true, userData: { role: userRole } };
  } catch (err) {
    return {
      success: false,
      error:
        getErrorMessage(err.code) ||
        err.message
          .replace("Firebase: ", "")
          .replace(/\([^)]*\)/g, "")
          .trim(),
    };
  }
};

/**
 * Creates a new user account using email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @param {string} selectedRole - The role selected during signup.
 * @param {Object} additionalData - Additional profile information.
 * @returns {Promise<Object>} Signup result and verification status.
 */
export const signupWithEmail = async (
  email,
  password,
  selectedRole,
  additionalData
) => {
  try {
    if (!auth || !db) {
      return { success: false, error: FIREBASE_CONFIG_ERROR };
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return { success: false, error: passwordError };
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );
    const user = userCredential.user;

    try {
      // Create user profile with role
      await createUserProfile(user, selectedRole, additionalData);

      // Send verification email to new users
      await sendEmailVerification(user);

      return { success: true, needsVerification: true };
    } catch (profileError) {
      // Clean up the orphaned user account using server-side Admin SDK
      // Client-side deleteUser() fails with auth/requires-recent-login if credential is stale
      console.error(
        `[signup] Profile creation failed for user ${user.uid}, initiating cleanup`
      );

      try {
        await fetch("/api/auth/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });
      } catch (cleanupErr) {
        console.error(
          `[signup] Cleanup failed for orphaned account ${user.uid}:`,
          cleanupErr.message
        );
      }

      await deleteDoc(doc(db, "users", user.uid)).catch(() => {});
      await deleteDoc(doc(db, "userStats", user.uid)).catch(() => {});
      throw profileError;
    }
  } catch (err) {
    return {
      success: false,
      error:
        getErrorMessage(err.code) ||
        err.message
          .replace("Firebase: ", "")
          .replace(/\([^)]*\)/g, "")
          .trim(),
    };
  }
};

/**
 * Authenticates a user using Google Sign-In.
 * @param {string} selectedRole - The role selected by the user.
 * @param {boolean} isLogin - Indicates whether the action is login or signup.
 * @param {Object} additionalData - Additional profile information.
 * @returns {Promise<Object>} Authentication result and user data.
 */

export const loginWithGoogle = async (
  selectedRole,
  isLogin,
  additionalData
) => {
  try {
    // INTERCEPT FOR MOCK AUTH MODE
    if (isMockAuthMode) {
      console.log(
        `[Mock Auth] Simulating Google Sign-In as: ${selectedRole || "student"}`
      );

      // Simulate a small network delay for realistic UI loading states/spinners
      await new Promise((resolve) => setTimeout(resolve, 600));

      // Construct a mock profile that mimics what your application context expects downstream
      const simulatedUserData = {
        ...MOCK_USER,
        role: selectedRole || MOCK_USER.role,
        fullName: MOCK_USER.displayName,
        lastLogin: new Date(),
      };

      return {
        success: true,
        userData: simulatedUserData,
      };
    }

    if (!auth || !db) {
      return { success: false, error: FIREBASE_CONFIG_ERROR };
    }

    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // For returning users, read role from custom claims (authoritative source)
    let userRole = null;

    if (isLogin) {
      const idTokenResult = await user.getIdTokenResult();
      userRole = idTokenResult.claims?.role;

      // Fallback: if no custom claims yet, read from Firestore and sync
      if (!userRole) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userRole = userDoc.data().role;
          await syncCustomClaims({
            user,
            role: userRole,
            fullName: userDoc.data().fullName,
          });
          const refreshed = await user.getIdTokenResult(true);
          userRole = refreshed.claims?.role || userRole;
        }
      }

      if (userRole && userRole !== selectedRole) {
        await signOut(auth);
        return {
          success: false,
          error: `This account is registered as ${
            ROLE_CONFIG[userRole]?.title || "Unknown"
          }. Please select the correct role.`,
        };
      }
    }

    if (!isLogin) {
      // New user via Google sign-up
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        userRole = userDoc.data().role;
      } else {
        const nameToUse =
          user.displayName?.trim() ||
          additionalData.fullName?.trim() ||
          user.email?.split("@")[0] ||
          "Learnova Member";

        if (!nameToUse) {
          console.error(
            `[google-signup] No name provided for user ${user.uid}, initiating cleanup`
          );
          try {
            await fetch("/api/auth/cleanup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: user.uid }),
            });
          } catch (cleanupErr) {
            console.error(
              `[google-signup] Cleanup failed for orphaned account ${user.uid}:`,
              cleanupErr.message
            );
          }

          await signOut(auth);
          return {
            success: false,
            error: "Please enter your full name",
          };
        }

        try {
          await createUserProfile(user, selectedRole, {
            ...additionalData,
            fullName: nameToUse,
          });
          await user.getIdToken(true);
          return { success: true, userData: { role: selectedRole } };
        } catch (profileError) {
          console.error(
            `[google-signup] Profile creation failed for user ${user.uid}, initiating cleanup`,
            profileError.message
          );
          try {
            await fetch("/api/auth/cleanup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ uid: user.uid }),
            });
          } catch (cleanupErr) {
            console.error(
              `[google-signup] Cleanup failed for orphaned account ${user.uid}:`,
              cleanupErr.message
            );
          }
          throw profileError;
        }
      }
    }

    // Update last login for existing users
    await setDoc(
      doc(db, "users", user.uid),
      {
        lastLogin: new Date(),
      },
      { merge: true }
    );

    return { success: true, userData: { role: userRole || selectedRole } };
  } catch (err) {
    return {
      success: false,
      error:
        getErrorMessage(err.code) ||
        err.message
          .replace("Firebase: ", "")
          .replace(/\([^)]*\)/g, "")
          .trim(),
    };
  }
};

/**
 * Triggers a password reset email via the secure backend API route.
 * @param {string} email - The user's email address.
 * @returns {Promise<Object>} Result of the password reset request.
 */
export const resetPassword = async (email) => {
  try {
    const sanitizedEmail = email.trim().toLowerCase();
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: sanitizedEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error ||
          getErrorMessage(data.error) ||
          "Failed to send reset email. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Reset password fetch error:", err);
    return {
      success: false,
      error:
        "An unexpected error occurred while communicating with the server.",
    };
  }
};
