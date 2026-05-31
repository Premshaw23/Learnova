import React, { useState, useEffect } from "react";
import Tooltip from "./Tooltip";

/**
 * ScrollToTop & ScrollToBottom Component
 * Two floating buttons at the bottom-right corner of the viewport.
 * - Scroll-to-top: appears when user scrolls down past 300px
 * - Scroll-to-bottom: appears when user is not at the bottom of the page
 * Built with pure React, Tailwind CSS transitions, and accessibility features.
 */
const ScrollToTop = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      // Show scroll-to-top when scrolled down past 300px
      setShowScrollTop(scrollY > 300);

      // Show scroll-to-bottom when not at the bottom
      setShowScrollBottom(scrollY + windowHeight < documentHeight - 10);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    // Run once on mount to set initial state
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  const buttonBase =
    "p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 hover:shadow-indigo-500/35 hover:-translate-y-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-95";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {/* Scroll to Bottom Button */}
      <Tooltip content="Scroll to Bottom" position="left">
        <button
          onClick={scrollToBottom}
          className={`${buttonBase} ${
            showScrollBottom
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-90 pointer-events-none"
          }`}
          aria-label="Scroll to bottom of the page"
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </button>
      </Tooltip>

      {/* Scroll to Top Button */}
      <Tooltip content="Scroll to Top" position="left">
        <button
          onClick={scrollToTop}
          className={`${buttonBase} ${
            showScrollTop
              ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
              : "opacity-0 translate-y-4 scale-90 pointer-events-none"
          }`}
          aria-label="Scroll back to top of the page"
        >
          <svg
            className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-0.5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
        </button>
      </Tooltip>
    </div>
  );
};

export default ScrollToTop;
EOF