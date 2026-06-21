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

    history.pushState = function (state, title, url) {
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

    history.replaceState = function (state, title, url) {
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

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isDirty]);
}
