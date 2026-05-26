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

const isValidApiKey =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your_api_key" &&
  !firebaseConfig.apiKey.includes("your");

if (isValidApiKey) {
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
      console.warn("[Firestore] Persistent cache init skipped:", err.code ?? err.message);
      db = getFirestore(app);
    }
  } else {
    // SSR — plain Firestore without persistence
    db = getFirestore(app);
  }
} else {
  console.warn("Firebase env vars missing or invalid. Running without Firebase.");
}

export { auth, db };

// Initialize Analytics only in browser (dynamic import avoids server-side module evaluation)
let analytics = null;

if (typeof window !== "undefined" && app) {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  }).catch(() => {});
}

export { analytics };

