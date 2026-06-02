"use client";

/**
 * contexts/FirestoreContext.js
 *
 * Global React Context that exposes pooled, cached Firestore collections.
 * Mount <FirestoreProvider> once in layout.js (inside <AuthProvider>) and every
 * downstream component can call useNotices(), useAttendance(), etc. without
 * creating their own onSnapshot listeners.
 *
 * Architecture:
 *  - Uses firestorePool (singleton) to deduplicate Firestore listeners.
 *  - Exposes stable references via useMemo / useCallback so consumers only
 *    re-render when their specific slice of data actually changes.
 *  - Offline persistence is enabled in lib/firebaseConfig.js; this context
 *    benefits automatically — cached reads work even when the device is offline.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import firestorePool from "@/lib/firestorePool";
import { db } from "@/lib/firebaseConfig";
import { collection, query, where, orderBy, limit } from "firebase/firestore";

// ─── Context ───────────────────────────────────────────────────────────────────

const FirestoreContext = createContext(null);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Internal hook — subscribes to one pool key and returns cached state.
 * Delivers the current cached value synchronously to avoid loading flash.
 */
function usePooledCollection(key, buildQuery, enabled = true) {
  const cached = firestorePool.getCached(key);
  const [data, setData] = useState(cached ?? []);
  const [loading, setLoading] = useState(cached === null && enabled);
  const [error, setError] = useState(null);
  const queryRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Build the Firestore query (may be null if db isn't ready)
    const q = buildQuery();
    if (!q) {
      if (!db) {
        setError(new Error("Firestore is not initialized. Check your Firebase configuration."));
      }
      setLoading(false);
      return;
    }
    queryRef.current = q;

    const unsub = firestorePool.subscribe(
      key,
      q,
      (docs) => {
        setData(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`[FirestorePool] Error on "${key}":`, err);
        setError(err);
        setLoading(false);
      }
    );

    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { data, loading, error };
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function FirestoreProvider({ children }) {
  const { user, userProfile, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;
  const userRole = userProfile?.role ?? "student";
  const isReady = !authLoading && !!uid;

  const instituteId = userProfile?.instituteId ?? null;
  const noticesKey = `notices:role:${userRole}:institute:${instituteId}`;
  const noticesQuery = useCallback(() => {
    if (!isReady || !db || !userProfile || !instituteId) return null;
    try {
      return query(
        collection(db, "notices"),
        where("targetAudience", "array-contains", userRole),
        where("instituteId", "==", instituteId),
        orderBy("createdAt", "desc"),
        limit(100)
      );
    } catch {
      return null;
    }
  }, [isReady, userRole, userProfile, instituteId]);

  const {
    data: notices,
    loading: noticesLoading,
    error: noticesError,
  } = usePooledCollection(noticesKey, noticesQuery, isReady);

  // ── Attendance ────────────────────────────────────────────────────────────────
  const attendanceKey = `attendance:uid:${uid}`;
  const attendanceQuery = useCallback(() => {
    if (!isReady || !db) return null;
    try {
      return query(
        collection(db, "attendance"),
        where("studentId", "==", uid),
        limit(60)
      );
    } catch {
      return null;
    }
  }, [isReady, uid]);

  const {
    data: attendanceRecords,
    loading: attendanceLoading,
    error: attendanceError,
  } = usePooledCollection(attendanceKey, attendanceQuery, isReady);

  // ── User Notifications ────────────────────────────────────────────────────────
  const userNotifKey = `userNotifications:uid:${uid}`;
  const userNotifQuery = useCallback(() => {
    if (!isReady || !db) return null;
    try {
      return query(
        collection(db, "notifications"),
        where("recipientId", "==", uid),
        limit(30)
      );
    } catch {
      return null;
    }
  }, [isReady, uid]);

  const {
    data: firestoreNotifications,
    loading: notificationsLoading,
    error: notificationsError,
  } = usePooledCollection(userNotifKey, userNotifQuery, isReady);

  // ── Stable context value (only re-creates when content changes) ────────────────
  const value = useMemo(
    () => ({
      // Notices
      notices,
      noticesLoading,
      noticesError,

      // Attendance
      attendanceRecords,
      attendanceLoading,
      attendanceError,

      // Firestore Notifications
      firestoreNotifications,
      notificationsLoading,
      notificationsError,

      // Auth passthrough helpers
      uid,
      userRole,
      isReady,
    }),
    [
      notices,
      noticesLoading,
      noticesError,
      attendanceRecords,
      attendanceLoading,
      attendanceError,
      firestoreNotifications,
      notificationsLoading,
      notificationsError,
      uid,
      userRole,
      isReady,
    ]
  );

  return (
    <FirestoreContext.Provider value={value}>
      {children}
    </FirestoreContext.Provider>
  );
}

// ─── Consumer Hooks ────────────────────────────────────────────────────────────

function useFirestoreContext() {
  const ctx = useContext(FirestoreContext);
  if (!ctx) {
    throw new Error(
      "useFirestoreContext must be used inside <FirestoreProvider>. " +
        "Make sure FirestoreProvider is mounted in app/layout.js."
    );
  }
  return ctx;
}

/** Returns the shared, cached notices array and loading state. */
export function useNotices() {
  const { notices, noticesLoading, noticesError } = useFirestoreContext();
  return { notices, loading: noticesLoading, error: noticesError };
}

/** Returns shared cached attendance records for the signed-in student. */
export function useAttendanceRecords() {
  const { attendanceRecords, attendanceLoading, attendanceError } =
    useFirestoreContext();
  return {
    attendanceRecords,
    loading: attendanceLoading,
    error: attendanceError,
  };
}

/** Returns shared cached Firestore notifications for the signed-in user. */
export function useFirestoreNotifications() {
  const { firestoreNotifications, notificationsLoading, notificationsError } =
    useFirestoreContext();
  return {
    firestoreNotifications,
    loading: notificationsLoading,
    error: notificationsError,
  };
}

/** Returns top-level auth helpers that FirestoreProvider already holds. */
export function useFirestoreAuth() {
  const { uid, userRole, isReady } = useFirestoreContext();
  return { uid, userRole, isReady };
}
