import {
  validateEmail,
  validateName,
  validatePassword,
  validateRequired,
} from "@/utils/formValidation";

/**
 * Builds the password requirement checklist displayed in signup forms.
 * @param {string} [password=""] - Password value to inspect.
 * @returns {Array<{label: string, met: boolean}>} Requirement labels and pass/fail state.
 */
export const getPasswordRequirementFlags = (password = "") => {
  const value = String(password || "");

  return {
    hasUpper: /[A-Z]/.test(value),
    hasLower: /[a-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value),
    lengthOk: value.length >= 8,
  };
};

/**
 * Validates an auth form field and returns either true or an inline error message.
 * @param {string} field - Field name to validate.
 * @param {string} value - Current field value.
 * @param {{isLogin?: boolean, password?: string}} [context] - Additional form state used by conditional rules.
 * @returns {true|string} True when valid, otherwise a user-facing validation message.
 */
export const validateAuthField = (field, value, context = {}) => {
  switch (field) {
    case "fullName":
      return validateName(value, "Full Name");
    case "instituteName":
      return validateRequired(value, "Institute Name");
    case "inviteCode":
      return validateRequired(value, "Invite Code");
    case "email":
      return validateEmail(value);
    case "password":
      return context.isLogin
        ? validateRequired(value, "Password")
        : validatePassword(value);
    case "confirmPassword":
      if (!value) {
        return "Please confirm your password";
      }

      if (value !== context.password) {
        return "Passwords do not match";
      }

      return true;
    default:
      return true;
  }
};