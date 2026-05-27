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
    required: true,
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

/**
 * Validates all required environment variables
 * @throws {Error} If any required environment variable is missing or invalid
 */
export function validateEnv() {
  const missingVars = [];
  const invalidVars = [];

  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

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

  if (missingVars.length > 0 || invalidVars.length > 0) {
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

    throw new Error(errorMessage);
  }

  console.log("✅ Environment variables validated successfully");
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
