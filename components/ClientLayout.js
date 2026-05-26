"use client";

import { useCallback, useEffect, useReducer } from "react";
import dynamic from "next/dynamic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import ErrorBoundary from "@/components/ErrorBoundary";
import ShortcutsModal from "@/components/ShortcutsModal";
import SearchModal from "@/components/SearchModal";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

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

const InstallPWA = dynamic(() => import("@/components/InstallPWA"), {
  ssr: false,
  loading: () => null,
});

const LearnovaChatbot = dynamic(() => import("@/components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout() {
  const [modalState, dispatch] = useReducer(modalReducer, modalInitialState);
  const { user, userProfile } = useAuth();

  const handleSearch = useCallback(() => {
    dispatch({ type: "OPEN_SEARCH" });
  }, []);

  const handleHelp = useCallback(() => {
    dispatch({ type: "OPEN_SHORTCUTS" });
  }, []);

  const handleEscape = useCallback(() => {
    dispatch({ type: "CLOSE_ALL" });
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

  // Central Consistency Streak & Firestore Synchronization Hook
  useEffect(() => {
    if (typeof window === "undefined" || !user) return;

    const syncStreak = async () => {
      try {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const localToday = new Date(today.getTime() - (offset * 60 * 1000));
        const todayDateStr = localToday.toISOString().split("T")[0];

        // 1. Get client-side localStorage values
        let clientStreak = parseInt(localStorage.getItem("learnova_site_streak") || "0", 10);
        let clientLastVisit = localStorage.getItem("learnova_site_last_visit") || "";
        let clientHistory = [];
        try {
          const historyStr = localStorage.getItem("learnova_site_visit_history");
          clientHistory = historyStr ? JSON.parse(historyStr) : [];
        } catch (_) {
          clientHistory = [];
        }
        if (!Array.isArray(clientHistory)) clientHistory = [];

        // 2. Fetch Firestore profile variables
        const firestoreStreak = userProfile?.siteStreak || 0;
        const firestoreLastVisit = userProfile?.siteLastVisit || "";
        const firestoreHistory = userProfile?.siteVisitHistory || [];

        let currentStreak = clientStreak;
        let lastVisit = clientLastVisit;
        let history = [...clientHistory];

        // 3. Bidirectional Sync & Restore Logic
        // Case A: Device has no streak records, but Firestore does! (New device login / local storage cleared)
        if (!lastVisit && firestoreLastVisit) {
          currentStreak = firestoreStreak;
          lastVisit = firestoreLastVisit;
          history = Array.isArray(firestoreHistory) ? [...firestoreHistory] : [];
          
          localStorage.setItem("learnova_site_streak", currentStreak.toString());
          localStorage.setItem("learnova_site_last_visit", lastVisit);
          localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));
          console.log(`[streak-sync] Restored streak of ${currentStreak} days from Firestore profile.`);
        }

        // Case B: Process today's check-in if last visit is different
        if (lastVisit !== todayDateStr) {
          let updatedStreak = currentStreak;
          
          if (!lastVisit) {
            // New streak initialization
            updatedStreak = 1;
          } else {
            const lastVisitDate = new Date(lastVisit);
            const currentVisitDate = new Date(todayDateStr);
            const diffTime = currentVisitDate.getTime() - lastVisitDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              // Consecutive check-in
              updatedStreak += 1;
            } else if (diffDays > 1) {
              // Streak broken
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

          // Save to LocalStorage
          localStorage.setItem("learnova_site_streak", currentStreak.toString());
          localStorage.setItem("learnova_site_last_visit", lastVisit);
          localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));

          // Trigger a beautiful notification
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
          // Same day visit, ensure today is in history
          if (!history.includes(todayDateStr)) {
            history.push(todayDateStr);
            localStorage.setItem("learnova_site_visit_history", JSON.stringify(history));
          }
        }

        // 4. Update Firestore if the local variables differ from Firestore to keep them perfectly in sync
        const needsSync = 
          currentStreak !== firestoreStreak ||
          lastVisit !== firestoreLastVisit ||
          JSON.stringify(history) !== JSON.stringify(firestoreHistory);

        if (needsSync && user.uid) {
          const userDocRef = doc(db, "users", user.uid);
          await updateDoc(userDocRef, {
            siteStreak: currentStreak,
            siteLastVisit: lastVisit,
            siteVisitHistory: history,
          });
          console.log(`[streak-sync] Synced streak of ${currentStreak} days to Firestore.`);
        }

      } catch (error) {
        console.error("[streak-sync] Sync error:", error);
      }
    };

    // Delay slightly to allow auth profile variables to load properly
    const timer = setTimeout(syncStreak, 1500);
    return () => clearTimeout(timer);
  }, [user, userProfile]);

  useKeyboardShortcuts({
    onSearch: handleSearch,
    onHelp: handleHelp,
    onEscape: handleEscape,
  });
  
  useIdleTimeout();

  return (
    <>
      <InstallPWA />
      <ShortcutsModal
        isOpen={modalState.isShortcutsOpen}
        onClose={() => dispatch({ type: "CLOSE_ALL" })}
      />
      <SearchModal
        isOpen={modalState.isSearchOpen}
        onClose={() => dispatch({ type: "CLOSE_ALL" })}
      />
      <ErrorBoundary>
        <LearnovaChatbot />
      </ErrorBoundary>
    </>
  );
}
