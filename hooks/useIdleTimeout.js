import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

const IDLE_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE = 2 * 60 * 1000;

export function useIdleTimeout() {
  const { signOut, isAuthenticated } = useAuth();
  const signOutRef = useRef(signOut);
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);
  const warningToastId = useRef(null);
  const throttleTimer = useRef(null);

  const clearTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }
  };

  const resetTimers = () => {
    clearTimers();

    warningTimer.current = setTimeout(() => {
      warningToastId.current = toast(
        "You've been idle. You will be logged out in 2 minutes.",
        { duration: WARNING_BEFORE, icon: "⚠️" }
      );
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    logoutTimer.current = setTimeout(async () => {
      await signOutRef.current();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];

    const throttledReset = () => {
      if (throttleTimer.current) return;

      throttleTimer.current = setTimeout(() => {
        throttleTimer.current = null;
      }, 1000);

      resetTimers();
    };

    events.forEach((e) =>
      window.addEventListener(e, throttledReset, { passive: true })
    );
    resetTimers();

    return () => {
      clearTimers();
      if (throttleTimer.current) clearTimeout(throttleTimer.current);
      events.forEach((e) => window.removeEventListener(e, throttledReset));
    };
  }, [isAuthenticated]);
}
