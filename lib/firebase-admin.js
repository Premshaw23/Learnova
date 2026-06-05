import admin from "firebase-admin";

let firebaseInitialized = false;
let initializationError = null;

export const initializeFirebase = () => {
  // Already initialized
  if (firebaseInitialized && admin.apps.length) {
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

    const decodedToken = await admin.auth().verifyIdToken(token, true);

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
