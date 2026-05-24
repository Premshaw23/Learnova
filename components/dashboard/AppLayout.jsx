import React from "react";
import ScrollToTop from "../ui/ScrollToTop";

/**
 * AppLayout Component
 * Shows how to integrate the <ScrollToTop /> component globally within your application.
 * Placing it at the root layout ensures it tracks scroll position across all pages
 * and renders a floating button fixed at the bottom-right corner.
 */
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      
      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Learnova Workspace</span>
        <div className="flex items-center space-x-4">
          <span className="text-xs font-semibold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">GSSOC '26</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 space-y-12">
        {children}
        
        {/* Long content mock to enable scrollable viewport */}
        <div className="space-y-6 max-w-3xl">
          <h1 className="text-3xl font-extrabold text-slate-950 dark:text-white">Curriculum Roadmap</h1>
          <p className="text-slate-500">Scroll down to view materials and trigger the scroll-to-top button.</p>
          <div className="h-96 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">Section 1</div>
          <div className="h-96 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">Section 2</div>
          <div className="h-96 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">Section 3</div>
        </div>
      </main>

      {/* Reusable scroll-to-top floating button mounted globally */}
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;
