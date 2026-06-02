/**
 * Environment Variable Validation Utility
 * 
 * This utility validates required environment variables at application startup
 * to prevent silent failures and provide clear error messages.
 */

const requiredEnvVars = {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: {
    description: "Firebase API Key",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: {
    description: "Firebase Auth Domain",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    description: "Firebase Project ID",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {
    description: "Firebase Storage Bucket",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: {
    description: "Firebase Messaging Sender ID",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_APP_ID: {
    description: "Firebase App ID",
    required: true,
  },
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: {
    description: "Firebase Measurement ID",
    required: false,
  },

  // MongoDB
  MONGODB_URI: {
    description: "MongoDB Connection URI",
    required: true,
  },

  // Groq AI
  GROQ_API_KEY: {
    description: "Groq API Key",
    required: false,
  },

  // Vercel Blob Storage
  BLOB_READ_WRITE_TOKEN: {
    description: "Vercel Blob Storage Token",
    required: false,
  },

  // EmailJS
  NEXT_PUBLIC_EMAILJS_SERVICE_ID: {
    description: "EmailJS Service ID",
    required: false,
  },
  NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: {
    description: "EmailJS Template ID",
    required: false,
  },
  NEXT_PUBLIC_EMAILJS_USER_ID: {
    description: "EmailJS User ID",
    required: false,
  },
};

let hasLoggedValidationWarning = false;
const ENV_VALIDATION_WARNING_KEY = "__learnovaEnvValidationWarningLogged";

export function getEnvValidationResult(env = process.env) {
  const missingVars = [];
  const invalidVars = [];

  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = env[varName];

    if (!value) {
      if (config.required) {
        missingVars.push(varName);
      }
      continue;
    }

    // Check if the value is a placeholder/default value
    if (value.includes("your_") || value.includes("here")) {
      invalidVars.push(varName);
    }
  }

  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars,
  };
}

export function formatEnvValidationError({ missingVars, invalidVars }) {
  let errorMessage = "❌ Environment Variable Validation Failed\n\n";

  if (missingVars.length > 0) {
    errorMessage += "Missing required environment variables:\n";
    missingVars.forEach((varName) => {
      errorMessage += `  - ${varName} (${requiredEnvVars[varName].description})\n`;
    });
    errorMessage += "\n";
  }

  if (invalidVars.length > 0) {
    errorMessage += "Invalid environment variables (placeholder values):\n";
    invalidVars.forEach((varName) => {
      errorMessage += `  - ${varName} (${requiredEnvVars[varName].description})\n`;
    });
    errorMessage += "\n";
  }

  errorMessage += "Please set these variables in your .env.local file.\n";
  errorMessage += "Reference .env.example for the required format.\n";

  return errorMessage;
}

/**
 * Validates all required environment variables
 * @param {Object} [options]
 * @param {boolean} [options.throwOnError=true] - Throw on validation failure
 * @param {boolean} [options.warnOnce=false] - Log at most one warning in non-throwing mode
 * @param {Console} [options.logger=console] - Logger to use for warnings/success
 * @throws {Error} If any required environment variable is missing or invalid
 */
export function validateEnv({ throwOnError = true, warnOnce = false, logger = console } = {}) {
  const result = getEnvValidationResult();

  if (!result.isValid) {
    const errorMessage = formatEnvValidationError(result);
    if (!throwOnError) {
      const warningAlreadyLogged =
        hasLoggedValidationWarning ||
        (typeof globalThis !== "undefined" && globalThis[ENV_VALIDATION_WARNING_KEY]);

      if (!warnOnce || !warningAlreadyLogged) {
        logger.warn(errorMessage);
        if (warnOnce) {
          hasLoggedValidationWarning = true;
          if (typeof globalThis !== "undefined") {
            globalThis[ENV_VALIDATION_WARNING_KEY] = true;
          }
        }
      }
      return result;
    }
    throw new Error(errorMessage);
  }

  logger.log("✅ Environment variables validated successfully");
  return result;
}

/**
 * Validates a specific environment variable
 * @param {string} varName - The environment variable name
 * @param {boolean} required - Whether the variable is required
 * @returns {string} The validated environment variable value
 * @throws {Error} If the variable is missing or invalid
 */
export function getEnvVar(varName, required = true) {
  const value = process.env[varName];

  if (!value) {
    if (required) {
      throw new Error(
        `Missing required environment variable: ${varName}\n` +
        `Description: ${requiredEnvVars[varName]?.description || varName}`
      );
    }
    return null;
  }

  // Check if the value is a placeholder/default value
  if (value.includes("your_") || value.includes("here")) {
    throw new Error(
      `Invalid environment variable: ${varName}\n` +
      `The value appears to be a placeholder. Please set the actual value in your .env.local file.`
    );
  }

  return value;
}
