"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import ErrorBoundary from "@/components/ErrorBoundary";
import ShortcutsModal from "@/components/ShortcutsModal";
import SearchModal from "@/components/SearchModal";

const InstallPWA = dynamic(() => import("@/components/InstallPWA"), {
  ssr: false,
  loading: () => null,
});

const LearnovaChatbot = dynamic(() => import("@/components/ChatBot"), {
  ssr: false,
  loading: () => null,
});

export default function ClientLayout() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = useCallback(() => {
    setIsSearchOpen(true);
  }, []);

  const handleHelp = useCallback(() => {
    setIsShortcutsOpen(true);
  }, []);

  const handleEscape = useCallback(() => {
    setIsShortcutsOpen(false);
    setIsSearchOpen(false);
    window.dispatchEvent(new CustomEvent("learnova:escape"));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpenShortcuts = () => setIsShortcutsOpen(true);
    const handleOpenSearch = () => setIsSearchOpen(true);
    
    window.addEventListener("learnova:open-shortcuts", handleOpenShortcuts);
    window.addEventListener("learnova:open-search", handleOpenSearch);
    
    return () => {
      window.removeEventListener("learnova:open-shortcuts", handleOpenShortcuts);
      window.removeEventListener("learnova:open-search", handleOpenSearch);
    };
  }, []);

  useKeyboardShortcuts({
    onSearch: handleSearch,
    onHelp: handleHelp,
    onEscape: handleEscape,
  });
  
  useIdleTimeout();

  return (
    <>
      <InstallPWA />
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <ErrorBoundary>
        <LearnovaChatbot />
      </ErrorBoundary>
    </>
  );
}
