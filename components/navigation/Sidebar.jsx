"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  getDashboardSidebarItems,
  isRouteActive,
} from "@/lib/navigation";
import SidebarNavItem from "./SidebarNavItem";
import { sidebarGlassClass } from "./glassStyles";
import {
  sidebarMobileVariants,
  sidebarVariants,
} from "./constants";

export default function Sidebar({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}) {
  const pathname = usePathname();
  const { userProfile, isAuthenticated } = useAuthContext();
  const role = userProfile?.role;
  const sections = getDashboardSidebarItems(role);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "4.5rem" : "16rem"
    );
    return () => {
      document.documentElement.style.removeProperty("--sidebar-width");
    };
  }, [collapsed]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileOpen]);

  const renderSection = (title, items) => (
    <div className="space-y-1">
      {!collapsed && title && (
        <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {title}
        </p>
      )}
      {items.map((item) => (
        <SidebarNavItem
          key={item.key || item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={isRouteActive(pathname, item.href)}
          collapsed={collapsed}
          onNavigate={onMobileClose}
        />
      ))}
    </div>
  );

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div
        className={`flex items-center border-b border-zinc-200/60 dark:border-white/10 px-3 py-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Navigation
              </p>
              <p className="truncate text-[10px] text-indigo-500 dark:text-indigo-400 uppercase tracking-wider font-semibold">
                Dashboard
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200/60 dark:border-white/10 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100/80 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav
        className="flex-1 overflow-y-auto px-2 py-4 space-y-5"
        aria-label="Dashboard navigation"
      >
        {isAuthenticated && renderSection("Workspace", sections.primary)}
        {renderSection(collapsed ? null : "Explore", sections.explore)}
        {isAuthenticated && renderSection("Account", sections.account)}
      </nav>

      {!collapsed && (
        <div className="border-t border-zinc-200/60 dark:border-white/10 p-3">
          <Link
            href="/activity"
            onClick={onMobileClose}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 px-3 py-2.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:from-indigo-500/15 hover:to-violet-500/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Discover Activities
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={collapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        className={`fixed left-0 top-16 z-[65] hidden h-[calc(100vh-4rem)] lg:block ${sidebarGlassClass}`}
        aria-label="Sidebar"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[85] bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
              aria-label="Close sidebar"
            />
            <motion.aside
              key="sidebar-mobile"
              variants={sidebarMobileVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`fixed left-0 top-0 z-[90] h-full w-[min(18rem,85vw)] pt-[max(4rem,env(safe-area-inset-top))] lg:hidden ${sidebarGlassClass}`}
              aria-label="Mobile sidebar"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
