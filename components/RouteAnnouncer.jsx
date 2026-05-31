"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function RouteAnnouncer() {
  const pathname = usePathname();
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  useEffect(() => {
    // Announce the new route to screen readers on navigation
    setRouteAnnouncement(`Navigated to ${document.title || pathname}`);
  }, [pathname]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: "0",
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: "0",
      }}
    >
      {routeAnnouncement}
    </div>
  );
}
