import admin from "firebase-admin";

let firebaseInitialized = false;
let initializationError = null;

export const initializeFirebase = () => {
  // Already initialized
  if (admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }

  initializationError = null;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Validate required env variables
    if (!projectId || !privateKey || !clientEmail) {
      throw new Error("Missing Firebase Admin environment variables");
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey,
        clientEmail,
      }),
    });

    firebaseInitialized = true;
  } catch (error) {
    initializationError = error;

    console.error("Firebase initialization failed:", {
      message: error.message,
      code: error.code,
    });

    throw error;
  }
};

export const initFirebaseAdmin = initializeFirebase;

/**
 * Verifies a Firebase ID token using the Firebase Admin SDK.
 * @param {string} token - The Firebase ID token string to verify.
 * @return {Promise<Object>} Structured auth result with { valid, decodedToken } on success.
 */
export const verifyFirebaseToken = async (token) => {
  try {
    initializeFirebase();

    // Verify the token header uses RS256 before passing to Admin SDK
    // This prevents algorithm confusion attacks where an attacker crafts
    // a token with a different signing algorithm
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      let headerPayload = parts[0].replace(/-/g, "+").replace(/_/g, "/");
      while (headerPayload.length % 4) headerPayload += "=";
      const headerJson =
        typeof atob === "function"
          ? atob(headerPayload)
          : Buffer.from(headerPayload, "base64").toString("utf8");
      const header = JSON.parse(headerJson);

      if (header.alg !== "RS256") {
        console.error("[auth] Token rejected: unsupported algorithm", {
          alg: header.alg,
        });
        return {
          valid: false,
          reason: "invalid_algorithm",
          error: "Only RS256 tokens are accepted",
        };
      }
    } catch (parseError) {
      return {
        valid: false,
        reason: "malformed_token",
        error: "Could not parse token header",
      };
    }

    const decodedToken = await admin.auth().verifyIdToken(token, true);

    // Ensure decoded token has required claims
    if (!decodedToken.sub) {
      return {
        valid: false,
        reason: "missing_claims",
        error: "Token missing required subject claim",
      };
    }

    return {
      valid: true,
      decodedToken,
    };
  } catch (error) {
    console.error("Token verification failed:", {
      message: error.message,
      code: error.code,
    });

    let reason = "unknown";

    switch (error.code) {
      case "auth/id-token-expired":
        reason = "expired";
        break;

      case "auth/id-token-revoked":
        reason = "revoked";
        break;

      case "auth/invalid-id-token":
      case "auth/argument-error":
        reason = "invalid_token";
        break;

      default:
        reason = firebaseInitialized ? "verification_failed" : "init_failed";
    }

    return {
      valid: false,
      reason,
      error: error.message,
    };
  }
};

export const getUserProfile = async (uid) => {
  try {
    initializeFirebase();

    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) return null;

    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", {
      message: error.message,
      code: error.code,
    });

    return null;
  }
};

export const getUserProfileByEmail = async (email) => {
  try {
    initializeFirebase();

    const snapshot = await admin
      .firestore()
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching user profile by email from Firestore:", {
      message: error.message,
      code: error.code,
    });

    return null;
  }
};

export const getAdminDb = () => {
  initializeFirebase();
  return admin.firestore();
};
