"use client";

import { useState, useCallback } from "react";
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
