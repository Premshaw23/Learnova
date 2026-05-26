import { USER_ROLES } from "@/constants/userRoles";
import { initializeUserStats } from "@/services/statsService";
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateName,
} from "./formValidation";
/**
 * Default password requirement validation message.
 * @type {string}
 */
export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.";

/**
 * Validates password strength for new accounts.
 * @param {string} password - Password entered by the user.
 * @returns {string|null} Error message when invalid, otherwise null.
 */
export const validatePasswordStrength = (password) => {
  if (!password) {
    return "Password is required";
  }

  const hasMinimumLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  if (
    !hasMinimumLength ||
    !hasUppercase ||
    !hasLowercase ||
    !hasNumber ||
    !hasSpecialCharacter
  ) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  return null;
};

/**
 * Returns a user-friendly authentication error message.
 * @param {string} errorCode - Firebase authentication error code.
 * @returns {string|null} Human-readable error message or null if not found.
 */
export const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with this email address.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/weak-password":
      return "Password must be 8+ chars with upper, lower, number, and special character.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return "Authentication failed. Please check your credentials and try again.";
  }
};

/**
 * Creates and stores a user profile via the server-side role validation
 * endpoint. The role is cryptographically signed into the Firebase token
 * via custom claims so the middleware can trust it.
 * @param {Object} user - Firebase authenticated user object.
 * @param {string} role - Role assigned to the user.
 * @param {Object} additionalData - Additional profile information.
 * @returns {Promise<Object>} The created user profile object.
 */
export const createUserProfile = async (user, role, additionalData = {}) => {
  const { fullName, instituteName } = additionalData;

  if (!fullName?.trim()) {
    throw new Error("Full name is required");
  }

  const idToken = await user.getIdToken();

  const response = await fetch("/api/auth/set-role", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      fullName: fullName.trim(),
      ...(role === USER_ROLES.INSTITUTE && instituteName?.trim()
        ? { instituteName: instituteName.trim() }
        : {}),
      ...(additionalData.inviteCode
        ? { inviteCode: additionalData.inviteCode }
        : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data.error || "Failed to create user profile. Please try again."
    );
  }

  // Initialize their empty dashboard stats
  await initializeUserStats(user.uid);

  return data.data.userProfile;
};

/**
 * Validates authentication form input fields.
 * @param {Object} formData - Form values entered by the user.
 * @param {boolean} isLogin - Indicates whether validation is for login or signup.
 * @returns {Object} Validation result containing status and error messages.
 */
export const validateForm = (formData, isLogin) => {
  const { selectedRole, email, password, fullName, instituteName, inviteCode } = formData;
  const errors = {};

  // Role is always required
  if (!selectedRole) {
    errors.role = "Please select your role";
  }

  const emailValidation = validateEmail(email);
  if (emailValidation !== true) {
    errors.email = emailValidation;
  }

  const passwordValidation = isLogin
    ? validateRequired(password, "Password")
    : validatePassword(password);
  if (passwordValidation !== true) {
    errors.password = passwordValidation;
  }

  if (!isLogin) {
    const fullNameValidation = validateName(fullName, "Full name");
    if (fullNameValidation !== true) {
      errors.fullName = fullNameValidation;
    }

    if (selectedRole === USER_ROLES.INSTITUTE) {
      const instituteNameValidation = validateRequired(
        instituteName,
        "Institute name",
      );
      if (instituteNameValidation !== true) {
        errors.instituteName = instituteNameValidation;
      }
    }

    if (selectedRole === USER_ROLES.TEACHER || selectedRole === USER_ROLES.INSTITUTE) {
      const inviteCodeValidation = validateRequired(
        inviteCode,
        "Invite code"
      );
      if (inviteCodeValidation !== true) {
        errors.inviteCode = inviteCodeValidation;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Redirects the user to the appropriate dashboard based on role.
 * @param {string} role - User role used for route navigation.
 * @param {Object} router - Next.js router instance.
 * @returns {void}
 */
export const redirectBasedOnRole = (role, router) => {
  try {
    switch (role) {
      case USER_ROLES.STUDENT:
        router.push("/student/dashboard");
        break;
      case USER_ROLES.TEACHER:
        router.push("/teacher/dashboard");
        break;
      case USER_ROLES.INSTITUTE:
        router.push("/institute/dashboard");
        break;
      case USER_ROLES.ADMIN:
        router.push("/admin/dashboard");
        break;
      default:
        router.push("/profile");
    }
  } catch (err) {
    throw new Error("Navigation failed. Please try refreshing the page.");
  }
};
