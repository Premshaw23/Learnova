"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import ShortcutsModal from "@/components/ShortcutsModal";

const InstallPWA = dynamic(() => import("@/components/InstallPWA"), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const handleSearch = useCallback(() => {
    window.dispatchEvent(new CustomEvent("learnova:open-search"));
  }, []);

  const handleHelp = useCallback(() => {
    setIsShortcutsOpen(true);
  }, []);

  const handleEscape = useCallback(() => {
    setIsShortcutsOpen(false);
    window.dispatchEvent(new CustomEvent("learnova:escape"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenShortcuts = () => setIsShortcutsOpen(true);
    window.addEventListener("learnova:open-shortcuts", handleOpenShortcuts);
    return () => window.removeEventListener("learnova:open-shortcuts", handleOpenShortcuts);
  }, []);

  useKeyboardShortcuts({
    onSearch: handleSearch,
    onHelp: handleHelp,
    onEscape: handleEscape,
  });

  return (
    <>
      <InstallPWA />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  );
}
