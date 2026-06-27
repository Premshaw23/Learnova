"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Keyboard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  mobileDrawerVariants,
  staggerContainer,
  staggerItem,
} from "./constants";
import { sidebarGlassClass } from "./glassStyles";

export default function MobileNavDrawer({
  isOpen,
  onClose,// Removed unused imports: isDark
  navigationItems,
  isRouteActive,
  isAuthenticated,
  loading,
  userMenuItems,
  getUserDisplayName,
  getUserRole,
  getUserPhoto,
  getUserInitials,
  handleLogout,
  handleImageError,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[85] bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            key="drawer"
            variants={mobileDrawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`fixed top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-[90] flex w-64 max-w-[calc(100vw-2rem)] flex-col space-y-4 rounded-2xl p-4 shadow-2xl sm:p-5 ${sidebarGlassClass}`}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between border-b border-zinc-100/60 pb-2 dark:border-white/8">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Menu
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="rounded-lg p-1 transition-colors hover:bg-zinc-100 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </motion.button>
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-3 rounded-xl border border-zinc-100/60 bg-zinc-50/60 p-2.5 dark:border-white/6 dark:bg-white/4">
                <div className="relative h-9 w-9 shrink-0">
                  {getUserPhoto() && (
                    <Image
                      src={getUserPhoto()}
                      alt={`${getUserDisplayName()} profile photo`}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                      onError={handleImageError}
                    />
                  )}
                  <div
                    className="fallback-avatar absolute inset-0 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white"
                    style={{ display: getUserPhoto() ? "none" : "flex" }}
                  >
                    {getUserInitials(getUserDisplayName())}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-[#070B14]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-[11px] text-zinc-400">{getUserRole()}</p>
                </div>
              </div>
            )}

            <motion.nav
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-0.5"
              aria-label="Mobile navigation"
            >
              {navigationItems.map((item) => {
                const isActive = isRouteActive(item.href);
                return (
                  <motion.div key={item.href} variants={staggerItem}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 ${
                        isActive
                          ? "bg-indigo-50 font-semibold text-indigo-600 dark:bg-indigo-600/15 dark:text-indigo-400"
                          : "font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/5"
                      }`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-indigo-500" : "text-zinc-400"}`}
                        aria-hidden="true"
                      />
                      {item.label}
                      {isActive && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            {isAuthenticated && (
              <div className="space-y-0.5 border-t border-zinc-100/60 pt-2 dark:border-white/8">
                {userMenuItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium text-zinc-700 transition-colors duration-200 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  >
                    <item.icon className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-zinc-100/60 pt-2 dark:border-white/8">
              {loading ? (
                <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              ) : isAuthenticated ? (
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  size="default"
                  className="h-10 w-full rounded-xl text-sm"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    asChild
                    size="default"
                    className="h-10 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm text-white shadow-md shadow-indigo-600/20"
                  >
                    <Link href="/auth" onClick={onClose}>
                      <span className="flex items-center gap-2">
                        Get Started <Sparkles className="h-4 w-4 text-indigo-200" />
                      </span>
                    </Link>
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <ThemeToggle />
              <div className="mt-auto flex flex-col gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(new CustomEvent("learnova:open-search"));
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Search</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    window.dispatchEvent(
                      new CustomEvent("learnova:open-shortcuts")
                    );
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60 rounded"
                >
                  <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Shortcuts</span>
                </button>
              </div>
              <p className="text-[10px] text-zinc-400/40">
                © {new Date().getFullYear()}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
