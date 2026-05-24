/**
 * Centrally managed validators for Learnova forms.
 * Each function returns `true` if validation passes, or an error message `string` if it fails.
 */

/**
 * Validates that a value is present and not blank.
 * @param {*} value - The input value.
 * @param {string} [fieldName="Field"] - The name of the field.
 * @returns {boolean|string}
 */
export const validateRequired = (value, fieldName = "Field") => {
  if (value === undefined || value === null) {
    return `${fieldName} is required`;
  }
  if (typeof value === "string" && !value.trim()) {
    return `${fieldName} is required`;
  }
  return true;
};

/**
 * Validates that a value meets the minimum length requirement.
 * @param {string} value - The input value.
 * @param {number} min - The minimum allowed length.
 * @param {string} [fieldName="Field"] - The name of the field.
 * @returns {boolean|string}
 */
export const validateMinLength = (value, min, fieldName = "Field") => {
  if (!value || value.length < min) {
    return `${fieldName} must be at least ${min} characters`;
  }
  return true;
};

/**
 * Validates an email address.
 * @param {string} value - The email address to validate.
 * @returns {boolean|string}
 */
export const validateEmail = (value) => {
  const presenceCheck = validateRequired(value, "Email");
  if (presenceCheck !== true) return presenceCheck;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return "Please enter a valid email";
  }
  return true;
};

/**
 * Validates password strength (8+ characters, upper, lower, digit, special character).
 * @param {string} value - The password to validate.
 * @returns {boolean|string}
 */
export const validatePassword = (value) => {
  const presenceCheck = validateRequired(value, "Password");
  if (presenceCheck !== true) return presenceCheck;

  const hasMinimumLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(value);

  if (!hasMinimumLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.";
  }

  return true;
};

/**
 * Validates a name (minimum 2 characters, no numbers or special characters).
 * @param {string} value - The name to validate.
 * @param {string} [fieldName="Name"] - The name of the field.
 * @returns {boolean|string}
 */
export const validateName = (value, fieldName = "Name") => {
  const presenceCheck = validateRequired(value, fieldName);
  if (presenceCheck !== true) return presenceCheck;

  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  const nameRegex = /^[\p{L}\s\-']+$/u;
  if (!nameRegex.test(trimmed)) {
    return `${fieldName} must only contain letters, spaces, hyphens, and apostrophes`;
  }

  return true;
};

/**
 * Validates a standard phone number format (bonus).
 * @param {string} value - The phone number to validate.
 * @returns {boolean|string}
 */
export const validatePhone = (value) => {
  const presenceCheck = validateRequired(value, "Phone number");
  if (presenceCheck !== true) return presenceCheck;

  const phoneRegex = /^\+?[1-9]\d{1,14}$|^[0-9]{10}$/;
  if (!phoneRegex.test(value.trim())) {
    return "Please enter a valid phone number";
  }

  return true;
};
