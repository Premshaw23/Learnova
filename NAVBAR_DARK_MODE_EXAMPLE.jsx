"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useTheme } from "next-themes";
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
  UserCheck,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import Image from "next/image";

/**
 * Enhanced Navbar Component with Dark Mode Support
 * Features:
 * - Theme toggle integration
 * - Dark mode styling
 * - Smooth transitions
 * - Responsive design
 */
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const {
    notifications,
    removeNotification,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const { user, userProfile, signOut, isAuthenticated } = useAuthContext();

  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { mounted: themeContextMounted, isDark } = useThemeContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollProgressValue = Number.isFinite(scrollProgress)
    ? scrollProgress
    : 0;

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / 100, 1);
      setScrollProgress(progress);
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  const handleClickOutside = useCallback((event) => {
    if (
      dropdownRef.current &&
      event.target &&
      !dropdownRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  // ESC Key Support
  useEffect(() => {
    const close = () => {
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
      setIsMenuOpen(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("learnova:escape", close);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("learnova:escape", close);
    };
  }, []);

  // Prevent body scroll
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
  }, [pathname]);

  // Notification handlers
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    await signOut();
  };

  // Helpers
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

  const getUserPhoto = () => {
    return user?.photoURL || null;
  };

  const getUserRole = () => {
    if (!userProfile?.role) return "User";
    return (
      userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
    );
  };

  const getDashboardLink = () => {
    if (!userProfile?.role) return "/profile";
    switch (userProfile.role) {
      case "student":
        return "/student/dashboard";
      case "teacher":
        return "/teacher/dashboard";
      case "institute":
        return "/institute/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/profile";
    }
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/activity", label: "Activities", icon: Activity },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  const userMenuItems = [
    { href: "/profile", icon: User, label: "Profile", key: "profile" },
    {
      href: getDashboardLink(),
      icon: Activity,
      label: "Dashboard",
      key: "dashboard",
    },
    { href: "/settings", icon: Settings, label: "Settings", key: "settings" },
  ];

  return (
    <>
      {/* Main Navbar */}
      <nav
        className={`
          sticky top-0 z-40
          bg-white dark:bg-slate-900
          border-b border-gray-200 dark:border-slate-800
          transition-all duration-300 ease-out
          shadow-sm dark:shadow-lg
          ${scrolled ? "shadow-md dark:shadow-xl" : ""}
        `}
        role="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div
                className={`
                  w-8 h-8 rounded-lg
                  bg-gradient-to-br from-purple-600 to-pink-600
                  flex items-center justify-center
                  group-hover:shadow-lg
                  transition-all duration-300
                `}
              >
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span
                className={`
                  text-xl font-bold
                  text-gray-900 dark:text-white
                  transition-colors duration-300
                  hidden sm:inline
                `}
              >
                Learnova
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      transition-all duration-300
                      ${
                        isActive
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Theme Toggle */}
              {themeContextMounted && mounted && <ThemeToggle />}

              {isAuthenticated && mounted ? (
                <>
                  {/* Notification Bell */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className={`
                        relative p-2 rounded-lg
                        text-gray-700 dark:text-gray-300
                        bg-gray-100 dark:bg-slate-800
                        hover:bg-gray-200 dark:hover:bg-slate-700
                        transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400
                      `}
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span
                          className={`
                            absolute top-1 right-1
                            w-5 h-5 rounded-full
                            bg-red-500 text-white text-xs
                            flex items-center justify-center
                            font-bold
                          `}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                      <div
                        className={`
                          absolute right-0 mt-2 w-80
                          bg-white dark:bg-slate-800
                          rounded-lg shadow-lg dark:shadow-xl
                          border border-gray-200 dark:border-slate-700
                          max-h-96 overflow-y-auto
                          transition-all duration-300
                        `}
                      >
                        {notifications.length > 0 ? (
                          <>
                            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                Notifications
                              </h3>
                              {unreadCount > 0 && (
                                <button
                                  onClick={markAllAsRead}
                                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                  Mark all as read
                                </button>
                              )}
                            </div>
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={`
                                  p-4 border-b border-gray-100 dark:border-slate-700
                                  ${
                                    !notif.read
                                      ? "bg-purple-50 dark:bg-purple-900/10"
                                      : ""
                                  }
                                  hover:bg-gray-50 dark:hover:bg-slate-700
                                  transition-colors duration-200
                                `}
                              >
                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {new Date(notif.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">
                              No notifications
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-gray-100 dark:bg-slate-800
                        text-gray-700 dark:text-gray-300
                        hover:bg-gray-200 dark:hover:bg-slate-700
                        transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                      `}
                    >
                      {getUserPhoto() ? (
                        <Image
                          src={getUserPhoto()}
                          alt={getUserDisplayName()}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div
                          className={`
                            w-8 h-8 rounded-full
                            bg-gradient-to-br from-purple-600 to-pink-600
                            flex items-center justify-center
                            text-white text-sm font-bold
                          `}
                        >
                          {getUserInitials(getUserDisplayName())}
                        </div>
                      )}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* User Dropdown Menu */}
                    {isDropdownOpen && (
                      <div
                        className={`
                          absolute right-0 mt-2 w-64
                          bg-white dark:bg-slate-800
                          rounded-lg shadow-lg dark:shadow-xl
                          border border-gray-200 dark:border-slate-700
                          overflow-hidden
                          transition-all duration-300
                        `}
                      >
                        {/* User Info */}
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {getUserRole()}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {userMenuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                              <Link
                                key={item.key}
                                href={item.href}
                                onClick={() => setIsDropdownOpen(false)}
                                className={`
                                  w-full flex items-center gap-3 px-4 py-2
                                  text-gray-700 dark:text-gray-300
                                  hover:bg-gray-100 dark:hover:bg-slate-700
                                  transition-colors duration-200
                                `}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-gray-200 dark:border-slate-700 p-2">
                          <button
                            onClick={handleLogout}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2
                              text-red-600 dark:text-red-400
                              hover:bg-red-50 dark:hover:bg-red-900/20
                              transition-colors duration-200
                            `}
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link href="/auth">
                    <Button
                      variant="outline"
                      className="hidden sm:inline-flex border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      Sign In
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`
                  md:hidden p-2 rounded-lg
                  text-gray-700 dark:text-gray-300
                  bg-gray-100 dark:bg-slate-800
                  hover:bg-gray-200 dark:hover:bg-slate-700
                  transition-all duration-300
                `}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className="h-1 bg-gradient-to-r from-purple-600 to-pink-600"
            style={{ width: `${scrollProgressValue * 100}%` }}
          />
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={`
            md:hidden
            bg-white dark:bg-slate-900
            border-b border-gray-200 dark:border-slate-800
            transition-all duration-300
          `}
        >
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2 rounded-lg
                    transition-all duration-300
                    ${
                      isActive
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
