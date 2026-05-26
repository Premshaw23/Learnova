import { auth, db } from "@/lib/firebaseConfig";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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
      password,
    );
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      return { success: false, needsVerification: true };
    }

    // Get user profile to check role
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Check if role matches selected role
      if (userData.role !== selectedRole) {
        await signOut(auth);
        return {
          success: false,
          error: `This account is registered as ${
            ROLE_CONFIG[userData.role]?.title || "Unknown"
          }. Please select the correct role.`,
        };
      }

      // Update last login — use updateDoc to avoid overwriting the
      // entire document (including role) with potentially stale data
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date(),
      });

      // Migrate existing users to have cryptographically signed custom
      // claims.  Fire-and-forget — the login succeeds regardless.
      void syncCustomClaims({
        user,
        role: userData.role,
        fullName: userData.fullName,
      });

      return { success: true, userData };
    } else {
      return { success: false, needsProfile: true };
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
  additionalData,
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
      password,
    );
    const user = userCredential.user;

    try {
      // Create user profile with role
      await createUserProfile(user, selectedRole, additionalData);

      // Send verification email to new users
      await sendEmailVerification(user);

      return { success: true, needsVerification: true };
    } catch (profileError) {
      // Clean up the orphaned user account if profile creation fails
      await deleteUser(user).catch(() => {});
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
  additionalData = {},
) => {
  try {
    if (!auth || !db) {
      return { success: false, error: FIREBASE_CONFIG_ERROR };
    }

    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, "users", user.uid));

    if (!userDoc.exists()) {
      if (isLogin) {
        // New Google user trying to login - need to sign up first
        // ✅ modular style
        await signOut(auth);
        return {
          success: false,
          error: "Account not found. Please sign up first.",
        };
      } else {
        // New Google user signing up - create profile with selected role
        const nameToUse = user.displayName || additionalData.fullName?.trim();
        if (!nameToUse) {
          await deleteUser(user).catch(() => {});
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
          // Force refresh the token to immediately acquire the new custom claims (role) on the client side
          await user.getIdToken(true);
        } catch (profileError) {
          await deleteUser(user).catch(() => {});
          throw profileError;
        }

        // Email is already verified with Google
        return { success: true, userData: { role: selectedRole } };
      }
    }

    const userData = userDoc.data();

    // For existing users, check if role matches selected role (for login)
    if (isLogin && userData && userData.role !== selectedRole) {
      await signOut(auth);
      return {
        success: false,
        error: `This account is registered as ${
          ROLE_CONFIG[userData.role]?.title || "Unknown"
        }. Please select the correct role.`,
      };
    }

    // Update last login for existing users
    if (userData) {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: new Date(),
      });

      // Migrate existing users to have cryptographically signed custom
      // claims.  Fire-and-forget — the login succeeds regardless.
      void syncCustomClaims({
        user,
        role: userData.role,
        fullName: userData.fullName,
      });
    }

    return { success: true, userData: userData || { role: selectedRole } };
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
        error: data.error || getErrorMessage(data.error) || "Failed to send reset email. Please try again.",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Reset password fetch error:", err);
    return {
      success: false,
      error: "An unexpected error occurred while communicating with the server.",
    };
  }
};
