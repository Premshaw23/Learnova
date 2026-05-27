"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (pathname) {
      setAnnouncement(`Navigated to ${pathname === "/" ? "Home" : pathname.replace(/\//g, " ").trim()}`);
    }
  }, [pathname]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {announcement}
    </div>
  );
}
