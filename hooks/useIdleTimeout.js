import { useEffect, useRef } from "react";
import { useAuth } from "./useAuth";
import toast from "react-hot-toast";

const IDLE_TIMEOUT = 15 * 60 * 1000;
const WARNING_BEFORE = 2 * 60 * 1000;

export function useIdleTimeout() {
  const { signOut } = useAuth();
  const logoutTimer = useRef(null);
  const warningTimer = useRef(null);
  const warningToastId = useRef(null);

  const clearTimers = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
  };

  const resetTimers = () => {
    clearTimers();

    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }

    warningTimer.current = setTimeout(() => {
      warningToastId.current = toast(
        "You've been idle. You will be logged out in 2 minutes.",
        { duration: WARNING_BEFORE, icon: "⚠️" }
      );
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    logoutTimer.current = setTimeout(async () => {
      toast.dismiss(warningToastId.current);
      await signOut();
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetTimers));
    resetTimers();

    return () => {
      clearTimers();
      events.forEach((e) => window.removeEventListener(e, resetTimers));
    };
  }, []);
}