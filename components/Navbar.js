"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Activity, Menu, X, User, Settings, Sparkles, Search, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import {
  NAVIGATION_ITEMS,
  getDashboardLink,
  isRouteActive,
  isDashboardRoute,
} from "@/lib/navigation";
import NavLink from "@/components/navigation/NavLink";
import NavbarBrand from "@/components/navigation/NavbarBrand";
import Sidebar from "@/components/navigation/Sidebar";
import MobileNavDrawer from "@/components/navigation/MobileNavDrawer";
import NotificationPanel from "@/components/navigation/NotificationPanel";
import UserMenu from "@/components/navigation/UserMenu";
import {
  getNavbarGlassStyle,
  gradientBorderTop,
  iconBtnClass,
  navCapsuleClass,
} from "@/components/navigation/glassStyles";
import { useTheme } from "next-themes";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { user, userProfile, signOut, isAuthenticated, loading } =
    useAuthContext();

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const isDark = (mounted ? resolvedTheme : null) === "dark";
  const onDashboard = isDashboardRoute(pathname);

  const switchLanguage = (lang) => {
    document.cookie = `locale=${lang}; path=/; max-age=31536000`;
    window.location.reload();
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownOpen(false);
    }
    if (notifRef.current && !notifRef.current.contains(e.target)) {
      setIsNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsDropdownOpen(false);
        setIsNotificationOpen(false);
        setIsMenuOpen(false);
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!onDashboard) {
      document.body.classList.toggle("overflow-hidden", isMenuOpen);
      return () => document.body.classList.remove("overflow-hidden");
    }
  }, [isMenuOpen, onDashboard]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMenuOpen(false);
      }
      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    setMobileSidebarOpen(false);
    await signOut();
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (userProfile?.fullName) return userProfile.fullName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getUserPhoto = () => user?.photoURL || null;

  const getUserRole = () => {
    if (!userProfile?.role) return "User";
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  const dashboardLink = getDashboardLink(userProfile?.role);

  const userMenuItems = [
    { href: "/profile", icon: User, label: "Profile", key: "profile" },
    {
      href: dashboardLink,
      icon: Activity,
      label: "Dashboard",
      key: "dashboard",
    },
    { href: "/settings", icon: Settings, label: "Settings", key: "settings" },
  ].filter((item) => !(item.key === "dashboard" && item.href === "/profile"));

  const handleImageError = (e) => {
    const img = e.target;
    const fallback = img.parentElement?.querySelector(".fallback-avatar");
    if (img && fallback) {
      img.style.display = "none";
      fallback.style.display = "flex";
    }
  };

  const checkRouteActive = (href) => isRouteActive(pathname, href);

  const handleMobileMenuToggle = () => {
    if (onDashboard) {
      setMobileSidebarOpen((open) => !open);
      return;
    }
    setIsMenuOpen((open) => !open);
  };

  const navStyle = getNavbarGlassStyle({ isDark, scrolled });

  return (
    <>
      <div
        className="pointer-events-none fixed top-0 z-[60] h-20 w-full bg-gradient-to-b from-[#070B14]/40 to-transparent transition-opacity duration-400 dark:from-[#070B14]/50"
        style={{ opacity: scrolled ? 0 : 1 }}
        aria-hidden="true"
      />

      <motion.nav
        className="fixed left-0 right-0 top-0 z-[70] w-full"
        style={navStyle}
        initial={{ y: -4, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-label="Main navigation"
      >
        <div
          className="pointer-events-none absolute left-0 right-0 top-0 h-px"
          style={{ background: gradientBorderTop(isDark) }}
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
            <NavbarBrand onNavigate={() => setIsMenuOpen(false)} />
            </div>

            <div className={navCapsuleClass}>
              {NAVIGATION_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={checkRouteActive(item.href)}
                />
              ))}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("learnova:open-search"))
                }
                className="flex items-center gap-1.5 rounded-xl border border-zinc-200/40 px-3 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-100/80 hover:text-zinc-900 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/8 dark:hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                aria-label="Open search"
              >
                <Search className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                <span className="hidden text-xs md:inline">Search</span>
                <kbd className="hidden items-center rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] leading-none text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 lg:inline-flex">
                  Ctrl K
                </kbd>
              </motion.button>

              <ThemeToggle />

              <div className="flex items-center gap-1 rounded-lg border border-zinc-200/50 p-1 dark:border-white/10">
                <button
                  onClick={() => switchLanguage("en")}
                  className="rounded px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  aria-label="Switch to English"
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage("hi")}
                  className="rounded px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                  aria-label="Switch to Hindi"
                >
                  हि
                </button>
              </div>

              {loading ? (
                <div className="h-9 w-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2 border-l border-zinc-200/60 pl-2 dark:border-white/10">
                  <NotificationPanel
                    isOpen={isNotificationOpen}
                    onToggle={() => setIsNotificationOpen((open) => !open)}
                    onCloseOthers={() => setIsDropdownOpen(false)}
                    panelRef={notifRef}
                  />
                  <UserMenu
                    isOpen={isDropdownOpen}
                    onToggle={() => setIsDropdownOpen((open) => !open)}
                    onClose={() => setIsDropdownOpen(false)}
                    onCloseOthers={() => setIsNotificationOpen(false)}
                    dropdownRef={dropdownRef}
                    userMenuItems={userMenuItems}
                    getUserDisplayName={getUserDisplayName}
                    getUserRole={getUserRole}
                    getUserPhoto={getUserPhoto}
                    getUserInitials={getUserInitials}
                    handleLogout={handleLogout}
                    handleImageError={handleImageError}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative"
                  >
                    <span className="absolute inset-0 rounded-xl bg-indigo-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20" />
                    <Button
                      asChild
                      size="default"
                      className="relative h-9 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500"
                    >
                      <Link href="/auth">
                        <span className="flex items-center gap-1.5">
                          Login <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative"
                  >
                    <span className="absolute inset-0 rounded-xl bg-indigo-500 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-20" />
                    <Button
                      asChild
                      size="default"
                      className="relative h-9 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500"
                    >
                      <Link href="/auth?mode=signup">
                        <span className="flex items-center gap-1.5">
                          Sign Up <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            <div className="sm:hidden">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={handleMobileMenuToggle}
                className={iconBtnClass}
                aria-label={onDashboard ? "Open dashboard sidebar" : "Toggle menu"}
                aria-expanded={onDashboard ? mobileSidebarOpen : isMenuOpen}
              >
                <AnimatePresence mode="wait">
                  {(onDashboard ? mobileSidebarOpen : isMenuOpen) ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 45, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -45, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {onDashboard ? (
                        <PanelLeft className="h-6 w-6" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {onDashboard && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
      )}

      {!onDashboard && (
        <MobileNavDrawer
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isDark={isDark}
          navigationItems={NAVIGATION_ITEMS}
          isRouteActive={checkRouteActive}
          isAuthenticated={isAuthenticated}
          loading={loading}
          userMenuItems={userMenuItems}
          getUserDisplayName={getUserDisplayName}
          getUserRole={getUserRole}
          getUserPhoto={getUserPhoto}
          getUserInitials={getUserInitials}
          handleLogout={handleLogout}
          handleImageError={handleImageError}
        />
      )}
    </>
  );
}
