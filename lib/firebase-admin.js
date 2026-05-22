import admin from "firebase-admin";

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized || admin.apps.length) return;

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    firebaseInitialized = true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
};

/**
 * Verifies a Firebase ID token using the Firebase Admin SDK.
 * @param {string} token - The Firebase ID token string to verify.
 * @returns {Promise<Object|null>} The decoded token payload if valid, or null if verification fails.
 * @example
 * const decoded = await verifyFirebaseToken(idToken);
 * if (decoded) console.log(decoded.uid);
 */
export const verifyFirebaseToken = async (token) => {
  try {
    initializeFirebase();
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};

export const getUserProfile = async (uid) => {
  try {
    initializeFirebase();
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) return null;
    return userDoc.data();
  } catch (error) {
    console.error("Error fetching user profile from Firestore:", error);
    return null;
  }
};

/**
 * Creates a session cookie from a Firebase ID token.
 * @param {string} idToken - The Firebase ID token.
 * @param {number} expiresIn - Expiration time in milliseconds.
 * @returns {Promise<string|null>} The session cookie string or null if creation fails.
 */
export const createSessionCookie = async (idToken, expiresIn) => {
  try {
    initializeFirebase();
    return await admin.auth().createSessionCookie(idToken, { expiresIn });
  } catch (error) {
    console.error("Session cookie creation error:", error);
    return null;
  }
};

/**
 * Verifies a Firebase session cookie.
 * @param {string} sessionCookie - The session cookie string.
 * @returns {Promise<Object|null>} The decoded token payload if valid, or null if verification fails.
 */
export const verifySessionCookie = async (sessionCookie) => {
  try {
    initializeFirebase();
    return await admin.auth().verifySessionCookie(sessionCookie, true);
  } catch (error) {
    console.error("Session cookie verification error:", error);
    return null;
  }
};
