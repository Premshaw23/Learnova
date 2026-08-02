"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "./useAuth";

export function useFocusTracking(contextId, contextType = "quiz") {
  const { token, userProfile } = useAuth();
  const hiddenTimeRef = useRef(null);

  useEffect(() => {
    if (!token || userProfile?.role !== "student") return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        hiddenTimeRef.current = Date.now();
      } else {
        if (hiddenTimeRef.current) {
          const distractionDurationMs = Date.now() - hiddenTimeRef.current;
          const distractionDurationSec = Math.floor(
            distractionDurationMs / 1000
          );

          hiddenTimeRef.current = null;

          // If away for more than 2 seconds, log it and warn
          if (distractionDurationSec >= 2) {
            toast.error(
              "Focus Mode: You switched tabs! This distraction has been logged.",
              { duration: 5000 }
            );

            try {
              await fetch("/api/analytics/focus-events", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  contextId,
                  contextType,
                  durationSeconds: distractionDurationSec,
                }),
              });
            } catch (error) {
              console.error("Failed to log focus event", error);
            }
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [token, userProfile, contextId, contextType]);
}
