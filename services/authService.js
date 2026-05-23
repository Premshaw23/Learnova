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
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  createUserProfile,
  getErrorMessage,
  validatePasswordStrength,
} from "@/utils/authUtils";
import { ROLE_CONFIG } from "@/constants/userRoles";

const FIREBASE_CONFIG_ERROR =
  "Firebase is not configured. Please add your Firebase environment variables to .env.local and restart the development server.";

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

      // Update last login
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        lastLogin: new Date(),
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

    // Create user profile with role
    await createUserProfile(user, selectedRole, additionalData);

    // Send verification email to new users
    await sendEmailVerification(user);

    return { success: true, needsVerification: true };
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
          // ✅ modular style
          await signOut(auth);
          return {
            success: false,
            error: "Please enter your full name",
          };
        }

        await createUserProfile(user, selectedRole, {
          ...additionalData,
          fullName: nameToUse,
        });

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
      await setDoc(doc(db, "users", user.uid), {
        ...userData,
        lastLogin: new Date(),
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
 * Sends a password reset email to the user.
 * @param {string} email - The user's email address.
 * @returns {Promise<Object>} Result of the password reset request.
 */
export const resetPassword = async (email) => {
  try {
    if (!auth) {
      return { success: false, error: FIREBASE_CONFIG_ERROR };
    }

    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error:
        getErrorMessage(err.code) ||
        "Failed to send reset email. Please try again.",
    };
  }
};
