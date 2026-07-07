"use client";

import { useEffect, useRef } from "react";

export default function useUnsavedChangesWarning(isDirty) {
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
    if (!isDirty) return;

    const MESSAGE = "You have unsaved changes. Are you sure you want to leave?";

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    let suppressNextConfirm = false;

    const handlePopState = () => {
      if (isDirtyRef.current) {
        if (!window.confirm(MESSAGE)) {
          suppressNextConfirm = true;
          history.pushState(null, "");
        }
      }
    };

    const customPushState = function (state, title, url) {
      if (
        !suppressNextConfirm &&
        isDirtyRef.current &&
        !window.confirm(MESSAGE)
      ) {
        return;
      }
      suppressNextConfirm = false;
      return originalPushState(state, title, url);
    };

    const customReplaceState = function (state, title, url) {
      if (
        !suppressNextConfirm &&
        isDirtyRef.current &&
        !window.confirm(MESSAGE)
      ) {
        return;
      }
      suppressNextConfirm = false;
      return originalReplaceState(state, title, url);
    };

    history.pushState = customPushState;
    history.replaceState = customReplaceState;

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      if (history.pushState === customPushState) {
        history.pushState = originalPushState;
      }
      if (history.replaceState === customReplaceState) {
        history.replaceState = originalReplaceState;
      }
    };
  }, [isDirty]);
}
