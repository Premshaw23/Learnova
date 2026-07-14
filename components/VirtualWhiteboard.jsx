"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import Excalidraw with SSR disabled because it relies on window/document
const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-2 text-indigo-500 font-medium">Loading Whiteboard...</span>
      </div>
    ),
  }
);

export default function VirtualWhiteboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="h-full w-full relative" style={{ minHeight: "600px" }}>
      <Excalidraw theme="dark" />
    </div>
  );
}
