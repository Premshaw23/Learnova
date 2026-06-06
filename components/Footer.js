"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ExternalLink, 
  Keyboard 
} from "lucide-react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  // Prevents hydration mismatches by waiting until client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="w-full border-t border-border bg-background py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {mounted ? new Date().getFullYear() : "2026"} Learnova. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
          <Link href="/activity" className="hover:underline flex items-center gap-1">
            Activity Centre <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
