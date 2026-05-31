import { onSnapshot } from "firebase/firestore";

/**
 * lib/firestorePool.js
 *
 * Centralized Firestore subscription pool.
 * Maintains exactly ONE active onSnapshot listener per unique query key.
 * Any number of React components can subscribe to the same key —
 * they all share the same underlying Firestore listener and receive
 * the identical cached snapshot without triggering extra reads.
 *
 * Usage:
 *   const unsub = firestorePool.subscribe(key, query, onData, onError);
 *   // later:
 *   unsub(); // decrements ref-count; unsubscribes from Firestore when count → 0
 */

const firestorePool = (() => {
  /**
   * Map<key, { unsub: fn, data: any, error: any, listeners: Set<fn>, errorListeners: Set<fn> }>
   */
  const pool = new Map();

  /**
   * Subscribe to a Firestore query through the pool.
   *
   * @param {string}   key       - Unique, stable string identifying this query.
   * @param {Query}    query     - Firestore Query object (from collection/query helpers).
   * @param {Function} onData    - Called with the latest data array on every snapshot.
   * @param {Function} [onError] - Called with any Firestore error.
   * @returns {Function} Unsubscribe function. Call it when the consumer unmounts.
   */
  function subscribe(key, query, onData, onError) {
    if (!pool.has(key)) {
      const entry = {
        unsub: null,
        data: null,
        error: null,
        listeners: new Set(),
        errorListeners: new Set(),
      };
      pool.set(key, entry);

      const firestoreUnsub = onSnapshot(
        query,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const e = pool.get(key);
          if (!e) return;
          e.data = docs;
          e.error = null;
          e.listeners.forEach((cb) => cb(docs));
        },
        (err) => {
          const e = pool.get(key);
          if (!e) return;
          e.error = err;
          e.errorListeners.forEach((cb) => cb(err));
        }
      );

      const e = pool.get(key);
      if (e) {
        e.unsub = firestoreUnsub;
      } else {
        firestoreUnsub();
      }
    }

    const entry = pool.get(key);
    entry.listeners.add(onData);
    if (onError) entry.errorListeners.add(onError);

    if (entry.data !== null) {
      onData(entry.data);
    }
    if (entry.error !== null && onError) {
      onError(entry.error);
    }

    return () => {
      const e = pool.get(key);
      if (!e) return;

      e.listeners.delete(onData);
      if (onError) e.errorListeners.delete(onError);

      if (e.listeners.size === 0) {
        if (e.unsub) e.unsub();
        pool.delete(key);
      }
    };
  }

  /**
   * Returns the last cached data for a key, or null if not yet loaded.
   */
  function getCached(key) {
    return pool.get(key)?.data ?? null;
  }

  /**
   * Force-clear every listener (useful in tests / hot-reload).
   */
  function reset() {
    pool.forEach((entry) => {
      if (entry.unsub) entry.unsub();
    });
    pool.clear();
  }

  return { subscribe, getCached, reset };
})();

export default firestorePool;
