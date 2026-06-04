"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { normalizeStreakCount } from "@/lib/streakUtils";
import ErrorBoundary from "@/components/ErrorBoundary";
import ShortcutsModal from "@/components/ShortcutsModal";
import SearchModal from "@/components/SearchModal";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, runTransaction } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useSessionMonitor } from "@/hooks/useSessionMonitor";
import {
  ensureClientCsrfToken,
  getClientCsrfToken,
  shouldAttachCsrfToken,
} from "@/lib/csrf";
import { useTimetableReminders } from "@/hooks/useTimetableReminders";
import { addRecentlyVisitedPage } from "@/utils/recentlyVisitedPages";
import { getRouteDisplayName } from "@/lib/navigation";

const modalInitialState = {
  isShortcutsOpen: false,
  isSearchOpen: false,
};

function modalReducer(state, action) {
  switch (action.type) {
    case "OPEN_SHORTCUTS":
      return {
        isShortcutsOpen: true,
        isSearchOpen: false,
      };
    case "OPEN_SEARCH":
      return {
        isShortcutsOpen: false,
        isSearchOpen: true,
      };
    case "CLOSE_ALL":
    case "ESCAPE":
      return modalInitialState;
    default:
      return state;
  }
}

const modalEventMap = {
  "learnova:open-shortcuts": "OPEN_SHORTCUTS",
  "learnova:open-search": "OPEN_SEARCH",
};

const CSRF_FETCH_PATCH_FLAG = "__learnovaCsrfFetchPatched";

const InstallPWA = dynamic(() => import("@/components/InstallPWA"), {
  ssr: false,
  loading: () => null,
});

const LearnovaChatbot = dynamic(() => import("@/components/LearnovaChatbot"), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout({ children }) {
  const [modalState, dispatch] = useReducer(modalReducer, modalInitialState);
  
  // Visibility state tracking logic for Nova Chat Modal
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const { user, userProfile } = useAuth();
  const pathname = usePathname();

  useOfflineSync();
  useSessionMonitor();
  useTimetableReminders();

  const handleSearch = useCallback(() => {
    dispatch({ type: "OPEN_SEARCH" });
  }, []);

  const handleHelp = useCallback(() => {
    dispatch({ type: "OPEN_SHORTCUTS" });
  }, []);

  const handleEscape = useCallback(() => {
    dispatch({ type: "CLOSE_ALL" });
    setIsChatOpen(false); 
    window.dispatchEvent(new CustomEvent("learnova:escape"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const listeners = Object.entries(modalEventMap).map(([eventName, actionType]) => {
      const listener = () => dispatch({ type: actionType });
      window.addEventListener(eventName, listener);
      return [eventName, listener];
    });

    return () => {
      listeners.forEach(([eventName, listener]) => {
        window.removeEventListener(eventName, listener);
      });
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;
    const originalFetch = window.fetch.bind(window);

    if (!window[CSRF_FETCH_PATCH_FLAG]) {
      window.fetch = async (input, init = {}) => {
        const requestInput = input instanceof Request ? input : null;
        const requestUrl =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.toString()
              : requestInput?.url || "";
        const requestMethod =
          (init.method || requestInput?.method || "GET").toUpperCase();

        if (shouldAttachCsrfToken(requestUrl, requestMethod)) {
          let csrfToken = getClientCsrfToken();
          if (!csrfToken) {
            csrfToken = await ensureClientCsrfToken(originalFetch);
          }

          if (csrfToken) {
            const requestHeaders = new Headers(requestInput?.headers || init.headers || {});
            if (!requestHeaders.has("x-csrf-token")) {
              requestHeaders.set("X-CSRF-Token", csrfToken);
            }

            if (requestInput) {
              input = new Request(requestInput, { headers: requestHeaders });
            } else {
              init = { ...init, headers: requestHeaders };
            }
          }
        }

        return originalFetch(input, init);
      };

      window[CSRF_FETCH_PATCH_FLAG] = true;
    }

    const bootstrapCsrf = async () => {
      if (!getClientCsrfToken()) {
        await ensureClientCsrfToken(originalFetch);
      }
    };

    bootstrapCsrf().catch(() => {
      if (!cancelled) {
        console.warn("[csrf] Failed to bootstrap CSRF token");
      }
    });

    return () => {
      cancelled = true;
      if (window[CSRF_FETCH_PATCH_FLAG]) {
        window.fetch = originalFetch;
        delete window[CSRF_FETCH_PATCH_FLAG];
      }
    };
  }, []);

  // Central Consistency Streak & Firestore Synchronization Hook
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const syncStreak = async () => {
      try {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localToday = new Date(today.getTime() - (offset * 60 * 1000));
        const todayDateStr = localToday.toISOString().split("T")[0];

        let clientStreak = normalizeStreakCount(localStorage.getItem("learnova_site_streak"));
        // 1. Get client-side localStorage values
        let clientLastVisit = localStorage.getItem("learnova_site_last_visit") || "";
        let clientHistory = [];
        try {
          const historyStr = localStorage.getItem("learnova_site_visit_history");
          clientHistory = historyStr ? JSON.parse(historyStr) : [];
        } catch (_) {
          clientHistory = [];
        }
        if (!Array.isArray(clientHistory)) clientHistory = [];

        const firestoreStreak = normalizeStreakCount(userProfile?.siteStreak) ?? 0;
        const firestoreLastVisit = userProfile?.siteLastVisit || "";
        const firestoreHistory = userProfile?.siteVisitHistory || [];

        let currentStreak = clientStreak;
        let lastVisit = clientLastVisit;
        let history = [...clientHistory];

        if (!lastVisit && firestoreLastVisit) {
          currentStreak = firestoreStreak;
          lastVisit = firestoreLastVisit;
          history = Array.isArray(firestoreHistory) ? [...firestoreHistory] : [];
          
          localStorage.setItem("learnova_site_streak", currentStreak.toString());
          localStorage.setItem("learnova_site_last_visit", lastVisit);
          localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));
        }

        if (lastVisit !== todayDateStr) {
          let updatedStreak = currentStreak;
          
          if (!lastVisit) {
            updatedStreak = 1;
          } else {
            const lastVisitDate = new Date(lastVisit);
            const currentVisitDate = new Date(todayDateStr);
            const diffTime = currentVisitDate.getTime() - lastVisitDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              updatedStreak += 1;
            } else if (diffDays > 1) {
              updatedStreak = 1;
            }
          }

          if (!history.includes(todayDateStr)) {
            history.push(todayDateStr);
            if (history.length > 30) {
              history = history.slice(-30);
            }
          }

          currentStreak = updatedStreak;
          lastVisit = todayDateStr;

          localStorage.setItem("learnova_site_streak", currentStreak.toString());
          localStorage.setItem("learnova_site_last_visit", lastVisit);
          localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));

          if (currentStreak > 1) {
            toast.success(`🔥 Blazing visit streak! ${currentStreak} consecutive days. Keep it up!`, {
              icon: "🔥",
              duration: 5000,
            });
          } else {
            toast.success("🌱 Daily streak started! Log in tomorrow to protect your flame.", {
              icon: "🌱",
              duration: 5000,
            });
          }
        } else {
          if (!history.includes(todayDateStr)) {
            history.push(todayDateStr);
            localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));
          }
        }

        if (user.uid) {
          const userDocRef = doc(db, "users", user.uid);
          await runTransaction(db, async (transaction) => {
            const snapshot = await transaction.get(userDocRef);
            if (!snapshot.exists()) return;

            const storedStreak = normalizeStreakCount(snapshot.data().siteStreak);
            const storedLastVisit = snapshot.data().siteLastVisit || "";
            const storedHistory = Array.isArray(snapshot.data().siteVisitHistory)
              ? snapshot.data().siteVisitHistory
              : [];

            const mergedStreak = Math.max(currentStreak, storedStreak);
            const mergedLastVisit = lastVisit > storedLastVisit ? lastVisit : storedLastVisit;
            const mergedHistory = [...new Set([...storedHistory, ...history])].slice(-30);

            transaction.set(userDocRef, {
              siteStreak: mergedStreak,
              siteLastVisit: mergedLastVisit,
              siteVisitHistory: mergedHistory,
            }, { merge: true });
          });
        }

      } catch (error) {
        console.error("[streak-sync] Sync error:", error);
      }
    };

    const timer = setTimeout(syncStreak, 1500);
    return () => clearTimeout(timer);
  }, [user, userProfile]);

  useKeyboardShortcuts({
    onSearch: handleSearch,
    onHelp: handleHelp,
    onEscape: handleEscape,
  });

  useEffect(() => {
    if (!pathname || typeof window === "undefined") return;

    addRecentlyVisitedPage({
      path: pathname,
      name: getRouteDisplayName(pathname, document.title),
    });
  }, [pathname]);
  
  useIdleTimeout();

  return (
    <>
      {children}
      
      <InstallPWA />
      <ShortcutsModal
        isOpen={modalState.isShortcutsOpen}
        onClose={() => dispatch({ type: "CLOSE_ALL" })}
      />
      <SearchModal
        isOpen={modalState.isSearchOpen}
        onClose={() => dispatch({ type: "CLOSE_ALL" })}
      />
      
      {/* 💥 DEAD SPARKLE FLOATING BUTTON REMOVED FROM HERE FOR CLEAN VIEWPORT CONTROL */}

      <ErrorBoundary>
        <LearnovaChatbot 
          isOpen={isChatOpen}
          user={user}
          onClose={() => setIsChatOpen(false)}
        />
      </ErrorBoundary>
    </>
  );
}