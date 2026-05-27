"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "next-themes";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  X,
  BookOpen,
  ChevronDown,
  User,
  Activity,
  LogOut,
  Settings,
  Sparkles,
  Home,
  Mail,
  Bell,
  Sun,
  Moon,
  Keyboard,
  Search,
  MessageSquareWarning,
} from "lucide-react";

// ── Animation Variants ──────────────────────────────────────────────────────

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -6, scale: 0.96,
    transition: { duration: 0.13, ease: "easeIn" },
  },
};

const mobileDrawerVariants = {
  hidden: { opacity: 0, x: 40, scale: 0.97 },
  visible: {
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, x: 30, scale: 0.97,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

const staggerContainer = {
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

// ── NavLink with animated active pill ───────────────────────────────────────

function NavLink({ href, label, isActive }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="relative text-sm font-semibold tracking-wide px-4 py-2 rounded-xl group after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[3px] after:rounded-full after:bg-gradient-to-r after:from-blue-500 after:via-cyan-400 after:to-violet-500 after:shadow-sm after:shadow-blue-500/30 after:pointer-events-none after:will-change-transform after:origin-left after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.4,0,0.2,1)] after:scale-x-0 group-hover:after:scale-x-100"
    >
      {isActive && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
        />
      )}
      <span className="absolute inset-0 rounded-xl bg-zinc-200/60 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
      <span className={`relative z-10 transition-colors duration-300 ${isActive
          ? "text-blue-600 dark:text-blue-400"
          : "text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-300"
        }`}>
        {label}
      </span>
    </Link>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user, userProfile, signOut, isAuthenticated, loading } = useAuthContext();

  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const isDark = (mounted ? resolvedTheme : null) === "dark";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", isMenuOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    await signOut();
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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

  const getDashboardLink = () => {
    switch (userProfile?.role) {
      case "student": return "/student/dashboard";
      case "teacher": return "/teacher/dashboard";
      case "institute": return "/institute/dashboard";
      case "admin": return "/admin/dashboard";
      default: return "/profile";
    }
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/productivity", label: "Focus", icon: Sparkles },
    { href: "/activity", label: "Activities", icon: Activity },
    { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  const userMenuItems = [
    { href: "/profile", icon: User, label: "Profile", key: "profile" },
    { href: getDashboardLink(), icon: Activity, label: "Dashboard", key: "dashboard" },
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

  // ── Shared style helpers ────────────────────────────────────────────────────

  const navStyle = {
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    backgroundColor: isDark
      ? scrolled ? "rgba(9,9,11,0.90)" : "rgba(9,9,11,0.65)"
      : scrolled ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.72)",
    borderBottom: isDark
      ? scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.05)"
      : scrolled ? "1px solid rgba(0,0,0,0.07)" : "1px solid rgba(0,0,0,0.04)",
    boxShadow: scrolled
      ? isDark
        ? "0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset"
        : "0 4px 32px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9) inset"
      : "none",
  };

  const glassPanelStyle = {
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  const dropdownPanel =
    "absolute right-0 mt-2 bg-white/90 dark:bg-zinc-950/90 border border-zinc-200/60 dark:border-white/8 rounded-2xl shadow-2xl z-[80] overflow-hidden";

  const iconBtn =
    "relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all duration-200 hover:bg-zinc-100/80 dark:hover:bg-white/8";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Top gradient fade */}
      <div
        className="fixed w-full top-0 z-[60] h-20 bg-gradient-to-b from-black/30 to-transparent pointer-events-none transition-opacity duration-400"
        style={{ opacity: scrolled ? 0 : 1 }}
      />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed w-full top-0 left-0 right-0 z-[70]"
        style={navStyle}
        initial={{ y: -4, opacity: 0.8 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent, rgba(59,130,246,0.4) 40%, rgba(139,92,246,0.3) 60%, transparent)"
              : "linear-gradient(90deg, transparent, rgba(59,130,246,0.2) 40%, rgba(139,92,246,0.15) 60%, transparent)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group shrink-0">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="relative"
              >
                <span className="absolute inset-0 rounded-xl bg-blue-500 opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300" />
                <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl text-white shadow-lg shadow-blue-600/20">
                  <BookOpen className="h-5 w-5" />
                </div>
              </motion.div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                  Learnova
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-black leading-none">
                  Premium
                </span>
              </div>
            </Link>

            {/* Center Nav Capsule */}
            <div className="hidden sm:flex items-center bg-zinc-100/60 dark:bg-white/5 border border-zinc-200/50 dark:border-white/8 rounded-2xl p-1 gap-0.5">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                />
              ))}
            </div>

            {/* Right Controls */}
            <div className="hidden sm:flex items-center gap-2">

              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.dispatchEvent(new CustomEvent("learnova:open-search"))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/80 dark:hover:bg-white/8 transition-colors border border-zinc-200/40 dark:border-white/8"
                aria-label="Open search"
              >
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="hidden md:inline text-xs">Search</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-200 dark:border-zinc-800 font-mono leading-none">
                  Ctrl K
                </kbd>
              </motion.button>

              {/* Theme Toggle */}
              {mounted && (
                <motion.button
                  whileHover={{ scale: 1.08, rotate: isDark ? 20 : -20 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className={iconBtn}
                  aria-label="Toggle theme"
                >
                  {isDark
                    ? <Sun className="h-4 w-4 text-amber-400" />
                    : <Moon className="h-4 w-4" />
                  }
                </motion.button>
              )}

              {/* Auth Area */}
              {loading ? (
                <div className="w-24 h-9 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-200/60 dark:border-white/8">

                  {/* Notifications */}
                  <div className="relative" ref={notifRef}>
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => {
                        setIsNotificationOpen(!isNotificationOpen);
                        setIsDropdownOpen(false);
                      }}
                      className={iconBtn}
                      aria-label="Notifications"
                    >
                      <Bell className="h-[18px] w-[18px]" />
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            className="absolute top-1.5 right-1.5 bg-red-500 rounded-full h-2 w-2 ring-2 ring-white dark:ring-zinc-950"
                          />
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden" animate="visible" exit="exit"
                          className={`${dropdownPanel} w-72`}
                          style={glassPanelStyle}
                        >
                          <div className="px-4 py-3 border-b border-zinc-100/60 dark:border-white/6 flex justify-between items-center">
                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Notifications</h3>
                            {unreadCount > 0 && (
                              <button onClick={markAllAsRead} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                Mark all read
                              </button>
                            )}
                          </div>
                          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100/50 dark:divide-white/5">
                            {notifications.length === 0 ? (
                              <p className="p-4 text-center text-sm text-zinc-400">No new notices</p>
                            ) : (
                              notifications.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => markAsRead(n.id)}
                                  className={`p-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/4 transition-colors ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                                >
                                  <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setIsDropdownOpen(!isDropdownOpen);
                        setIsNotificationOpen(false);
                      }}
                      className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-xl hover:bg-zinc-100/80 dark:hover:bg-white/6 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/8 transition-all duration-200"
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                      aria-controls="profile-menu"
                      aria-label="Toggle profile menu"
                    >
                      <div className="relative w-7 h-7 shrink-0">
                        {getUserPhoto() && (
                          <Image
                            src={getUserPhoto()} alt={`${getUserDisplayName()} profile photo`}
                            width={28} height={28}
                            className="rounded-full object-cover ring-2 ring-blue-500/30"
                            onError={handleImageError}
                          />
                        )}
                        <div className="fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold" style={{ display: getUserPhoto() ? "none" : "flex" }}>
                          {getUserInitials(getUserDisplayName())}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                      </div>

                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 hidden md:inline max-w-[80px] truncate">
                        {getUserDisplayName().split(" ")[0]}
                      </span>
                      <motion.span
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex"
                      >
                        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
                      </motion.span>
                    </motion.button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          id="profile-menu"
                          role="menu"
                          variants={dropdownVariants}
                          initial="hidden" animate="visible" exit="exit"
                          className={`${dropdownPanel} w-52 py-1.5`}
                          style={glassPanelStyle}
                        >
                          <div className="px-4 py-3 border-b border-zinc-100/60 dark:border-white/6">
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{getUserDisplayName()}</p>
                            <p className="text-xs text-zinc-400 mt-0.5">{getUserRole()}</p>
                          </div>
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.key}
                              href={item.href}
                              role="menuitem"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors gap-2.5"
                            >
                              <item.icon className="h-4 w-4 text-zinc-400" />
                              {item.label}
                            </Link>
                          ))}
                          <div className="my-1 border-t border-zinc-100/60 dark:border-white/6" />
                          <button
                            type="button"
                            role="menuitem"
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/8 transition-colors gap-2.5"
                          >
                            <LogOut className="h-4 w-4" /> Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Login Button */}
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative group">
                    <span className="absolute inset-0 rounded-xl bg-blue-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
                    <Button
                      asChild
                      size="default"
                      className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl px-5 h-9 text-sm shadow-md shadow-blue-600/25 border border-blue-500/30 transition-all duration-200"
                    >
                      <Link href="/auth">
                        <span className="flex items-center gap-1.5">
                          Login <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>

                  {/* Signup Button */}
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="relative group">
                    <span className="absolute inset-0 rounded-xl bg-blue-500 opacity-0 group-hover:opacity-20 blur-lg transition-opacity duration-300" />
                    <Button
                      asChild
                      size="default"
                      className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-xl px-5 h-9 text-sm shadow-md shadow-blue-600/25 border border-blue-500/30 transition-all duration-200"
                    >
                      <Link href="/auth?mode=signup">
                        <span className="flex items-center gap-1.5">
                          Sign Up <Sparkles className="h-3.5 w-3.5 text-blue-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={iconBtn}
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.span key="x"
                      initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ) : (
                    <motion.span key="menu"
                      initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 z-[85]"
              style={{ backdropFilter: "blur(4px)" }}
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.div
              key="drawer"
              variants={mobileDrawerVariants}
              initial="hidden" animate="visible" exit="exit"
              className="fixed top-4 right-4 max-w-[85vw] w-64 rounded-2xl shadow-2xl p-4 space-y-4 z-[90] flex flex-col"
              style={{
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                backgroundColor: isDark ? "rgba(9,9,11,0.93)" : "rgba(255,255,255,0.95)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100/60 dark:border-white/8">
                <span className="font-bold text-xs text-zinc-400 uppercase tracking-wider">Menu</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
                >
                  <X className="h-4 w-4 text-zinc-400" />
                </motion.button>
              </div>

              {/* User strip */}
              {isAuthenticated && (
                <div className="flex items-center gap-3 p-2.5 bg-zinc-50/60 dark:bg-white/4 rounded-xl border border-zinc-100/60 dark:border-white/6">
                  <div className="relative w-9 h-9 shrink-0">
                    {getUserPhoto() && (
                      <Image src={getUserPhoto()} alt={`${getUserDisplayName()} profile photo`} width={36} height={36} className="rounded-full object-cover" onError={handleImageError} />
                    )}
                    <div className="fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold" style={{ display: getUserPhoto() ? "none" : "flex" }}>
                      {getUserInitials(getUserDisplayName())}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-400 rounded-full ring-2 ring-white dark:ring-zinc-950" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">{getUserDisplayName()}</p>
                    <p className="text-[11px] text-zinc-400">{getUserRole()}</p>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <motion.div
                variants={staggerContainer}
                initial="hidden" animate="visible"
                className="flex flex-col gap-0.5"
              >
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <motion.div key={item.href} variants={staggerItem}>
                      <Link
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                            ? "bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5"
                          }`}
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-blue-500" : "text-zinc-400"}`} />
                        {item.label}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Account links */}
              {isAuthenticated && (
                <div className="pt-2 border-t border-zinc-100/60 dark:border-white/8 space-y-0.5">
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <item.icon className="h-4 w-4 text-zinc-400" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}

              {/* CTA / Logout */}
              <div className="pt-2 border-t border-zinc-100/60 dark:border-white/8">
                {loading ? (
                  <div className="w-full h-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
                ) : isAuthenticated ? (
                  <Button onClick={handleLogout} variant="destructive" size="default" className="w-full rounded-xl text-sm h-10">
                    <LogOut className="h-4 w-4 mr-2" /> Logout
                  </Button>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button asChild size="default" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm h-10 shadow-md shadow-blue-600/20">
                      <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                        <span className="flex items-center gap-2">
                          Get Started <Sparkles className="h-4 w-4 text-blue-200" />
                        </span>
                      </Link>
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Footer: theme + search + shortcuts */}
              <div className="flex items-center justify-between pt-1">
                {mounted && (
                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
                  </motion.button>
                )}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.dispatchEvent(new CustomEvent("learnova:open-search"));
                    }}
                    className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-blue-600 transition-colors text-xs"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>Search</span>
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"));
                    }}
                    className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-blue-600 transition-colors text-xs"
                  >
                    <Keyboard className="h-3.5 w-3.5" />
                    <span>Shortcuts</span>
                  </button>
                </div>
                <p className="text-zinc-400/40 text-[10px]">© {new Date().getFullYear()}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
