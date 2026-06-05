import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  sendEmailVerification,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, isSupported } from "firebase/messaging";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app;
let auth = null;
let db = null;

const requiredFirebaseConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingFirebaseConfig = requiredFirebaseConfig.filter((key) => {
  const value = firebaseConfig[key];
  return !value || value.includes("your_") || value.includes("here");
});

export const isFirebaseConfigured = missingFirebaseConfig.length === 0;

// Mock authentication mode requires ALL THREE conditions to be true:
// 1. Firebase credentials are missing (not configured)
// 2. Running in local development (NODE_ENV === "development")
// 3. Developer has explicitly opted in (NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH === "true")
//
// This prevents accidental mock auth activation on staging/preview deployments
// where Firebase env vars may be absent but real users are accessing the app.
// NEVER set NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH=true in production or preview environments.
export const isMockAuthMode =
  !isFirebaseConfigured &&
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH === "true";

// Central mock user definition — single source of truth for all dev mock auth.
// Only consumed when isMockAuthMode is true.
// Do NOT create additional MOCK_USER objects in page components or services.
export const MOCK_USER = {
  uid: "mock_developer_user_123",
  email: "test-contributor@learnova.com",
  displayName: "Learnova Contributor",
  photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=learnova",
  emailVerified: true,
  role: "student", // Adapts gracefully to view dashboard route layers
};

const firebaseConfigError =
  "❌ Firebase Configuration Error\n\n" +
  "Missing or invalid Firebase environment variables.\n" +
  "Required variables:\n" +
  "  - NEXT_PUBLIC_FIREBASE_API_KEY\n" +
  "  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN\n" +
  "  - NEXT_PUBLIC_FIREBASE_PROJECT_ID\n" +
  "  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET\n" +
  "  - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID\n" +
  "  - NEXT_PUBLIC_FIREBASE_APP_ID\n\n" +
  "Please set these variables in your .env.local file.\n" +
  "Reference .env.example for the required format.";

if (isMockAuthMode) {
  // Graceful degradation message for local frontend designers
  console.warn(
    "⚠️ [Learnova] Firebase credentials missing in Local Development.\n" +
      "Bypassing real cloud authentication. Running application in MOCK AUTH MODE."
  );
  app = null;
  auth = null;
  db = null;
} else if (!isFirebaseConfigured) {
  // Strict tracking for actual production builds where keys are broken
  console.warn(firebaseConfigError);
} else {
  // Avoid re-initializing on hot-reload
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);

  // Use the modern persistent cache API (Firestore v9.21+).
  // This replaces enableIndexedDbPersistence and supports multiple tabs natively.
  // Falls back to getFirestore() if the environment does not support it (e.g. SSR).
  if (typeof window !== "undefined") {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch (err) {
      // initializeFirestore throws if Firestore was already initialized for this app
      // (e.g. in development fast-refresh). Fall back to the already-initialised instance.
      console.warn(
        "[Firestore] Persistent cache init skipped:",
        err.code ?? err.message
      );
      db = getFirestore(app);
    }
  } else {
    // SSR - plain Firestore without persistence
    db = getFirestore(app);
  }
}

export { auth, db };

// Initialize Analytics and Messaging only in browser
let analytics = null;
let messaging = null;

if (typeof window !== "undefined" && app) {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    })
    .catch(() => {});

  isSupported()
    .then((supported) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    })
    .catch(() => {});
}

export { analytics, messaging };
