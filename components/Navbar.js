"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
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
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";

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

  const unreadCount = notifications.filter(
  (n) => !n.read
  ).length;

  const { user, userProfile, signOut, isAuthenticated } =
    useAuthContext();

  const dropdownRef = useRef(null);
  const pathname = usePathname();

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

    return () =>
      window.removeEventListener("scroll", handleScroll);
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
    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [handleClickOutside]);

  // ESC Key Support — also listens to the global learnova:escape custom event
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
    if (userProfile?.fullName)
      return userProfile.fullName;

    if (user?.displayName)
      return user.displayName;

    if (user?.email)
      return user.email.split("@")[0];

    return "User";
  };

  const getUserPhoto = () => {
    return user?.photoURL || null;
  };

  const getUserRole = () => {
    if (!userProfile?.role) return "User";

    return (
      userProfile.role.charAt(0).toUpperCase() +
      userProfile.role.slice(1)
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
    {
      href: "/",
      label: "Home",
      icon: Home,
    },
    {
      href: "/activity",
      label: "Activities",
      icon: Activity,
    },
    {
      href: "/contact",
      label: "Contact",
      icon: Mail,
    },
  ];

  const userMenuItems = [
    {
      href: "/profile",
      icon: User,
      label: "Profile",
      key: "profile",
    },
    {
      href: getDashboardLink(),
      icon: Activity,
      label: "Dashboard",
      key: "dashboard",
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      key: "settings",
    },
  ].filter(
    (item) =>
      !(
        item.key === "dashboard" &&
        item.href === "/profile"
      )
  );

  const handleImageError = (e) => {
    const img = e.target;

    const fallback =
      img.parentElement?.querySelector(
        ".fallback-avatar"
      );

    if (img && fallback) {
      img.style.display = "none";
      fallback.style.display = "flex";
    }
  };

  return (
    <>
      <div
        className="fixed w-full top-0 z-[60] h-24 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none transition-opacity duration-300"
        style={{
          opacity: 1 - scrollProgressValue * 0.5,
        }}
      />

      <nav
        className="fixed w-full top-0 left-0 right-0 z-[70] transition-all duration-300 ease-out"
        style={{
          backgroundColor: `rgba(0,0,0,${
            scrollProgressValue * 0.4
          })`,
          backdropFilter: `blur(${
            scrollProgressValue * 24
          }px)`,
          WebkitBackdropFilter: `blur(${
            scrollProgressValue * 24
          }px)`,
          borderBottom: `1px solid rgba(255,255,255,${
            scrollProgressValue * 0.1
          })`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3"
            >
              <div className="bg-gradient-to-br from-accent to-blue-500 p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>

              <div>
                <span className="text-xl font-bold text-white">
                  Learnova
                </span>

                <p className="text-xs text-white/50 uppercase">
                  Premium
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2">
        
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-accent/20 text-white"
                        : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              { isAuthenticated ? (
                <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-6">
                
                  <Button asChild className="hidden md:block relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                    <Link href="/attendance">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Mark Attendance
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Link>
                  </Button>
                  <Button asChild className="hidden lg:block relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                    <Link href="/notices">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Notice Board
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Link>
                  </Button>


                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setIsNotificationOpen(
                          !isNotificationOpen
                        )
                      }
                      aria-label="Open notifications"
                      aria-expanded={isNotificationOpen}
                      className="relative p-2 rounded-xl text-white hover:bg-white/5"
                    >
                      <Bell className="h-5 w-5" />

                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-[52] overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                          <h3 className="text-white font-semibold">
                            Notifications
                          </h3>

                          {unreadCount > 0 && (
                            <button
                              onClick={
                                markAllAsRead
                              }
                              aria-label="Mark all notifications as read"
                              className="text-xs text-accent"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto">
                          {notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() =>
                              markAsRead(n.id)
                          }
                              className={`w-full text-left p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 ${
                                !n.read
                                  ? "bg-accent/5"
                                  : ""
                              }`}
                            >
                              <p className="text-sm text-white">
                                {n.message}
                              </p>

                              <p className="text-xs text-white/40 mt-1">
                                {n.time}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Dropdown */}
                  <div
                    className="relative"
                    ref={dropdownRef}
                  >
                    <button
                      onClick={() =>
                        setIsDropdownOpen(
                          !isDropdownOpen
                        )
                      }
                      aria-label="Open user menu"
                      aria-expanded={isDropdownOpen}
                      className="flex items-center space-x-3 p-2 rounded-xl text-white hover:bg-white/5"
                    >
                      <div className="relative w-10 h-10">

                        {getUserPhoto() ? (
                          <Image
                            src={getUserPhoto()}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full object-cover border-2 border-accent/50"
                            onError={
                              handleImageError
                            }
                          />
                        ) : (
                          <div className="fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {getUserInitials(
                                getUserDisplayName()
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium">
                          {getUserDisplayName()}
                        </p>

                        <p className="text-xs text-white/60">
                          {getUserRole()}
                        </p>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          isDropdownOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 min-w-64 bg-black/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 py-2 z-[100] overflow-hidden">
                        {userMenuItems.map(
                          (item) => (
                            <Link
                              key={item.key}
                              href={item.href}
                              onClick={() =>
                                setIsDropdownOpen(
                                  false
                                )
                              }
                              className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                            >
                              <item.icon className="h-4 w-4 mr-3" />

                              {item.label}
                            </Link>
                          )
                        )}

                        <hr className="my-2 border-white/10" />

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ml-2 md:ml-6">
                  <Button asChild className="relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                    <Link href="/auth">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Login / Signup
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Toggle Menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-accent hover:bg-white/10 transition-all duration-300 hover:scale-110 relative group"
              >
                {isMenuOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          <button
            aria-label="Close mobile menu"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[49] md:hidden"
            onClick={() =>
              setIsMenuOpen(false)
            }
          />

          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-black z-[52] md:hidden border-l border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-white text-lg font-bold">
                Menu
              </h2>

              <Button
                variant="ghost"
                size="sm"
                aria-label="Close menu"
                onClick={() =>
                  setIsMenuOpen(false)
                }
                className="text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* User Info Section */}
            {isAuthenticated && (
              <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-14 h-14 relative">
                    {getUserPhoto() && (
                      <Image
                        src={getUserPhoto()}
                        alt="Profile"
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full border-2 border-accent/50 object-cover shadow-lg"
                        onError={handleImageError}
                      />
                    )}
                    <div
                      className={`fallback-avatar absolute inset-0 w-14 h-14 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center border-2 border-accent/50 shadow-lg ${getUserPhoto() ? "hidden" : "flex"
                        } `}
                    >
                      <span className="text-lg font-bold text-white">
                        {getUserInitials(getUserDisplayName())}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">
                      {getUserDisplayName()}
                    </h3>
                    <p className="text-white/60 text-sm truncate">
                      {user?.email || ""}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                      <span className="text-xs text-yellow-400 font-medium">
                        {getUserRole()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild className="w-full bg-gradient-to-r from-accent/90 to-blue-500/90 hover:from-accent hover:to-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                    <Link href="/attendance" onClick={() => setIsMenuOpen(false)}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Attendance
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                    <Link href="/notices" onClick={() => setIsMenuOpen(false)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Notices
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Menu - FIXED: Removed inline animation delay styles */}
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 space-y-2">
                {/* Main Navigation */}
                <div className="mb-6">
                  <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h4>
                  {navigationItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-accent/10 hover:to-blue-500/10 transition-all duration-200 rounded-xl group animate-fadeIn-delay-${index}`}
                    >
                      <item.icon className="h-5 w-5 mr-4 group-hover:text-accent transition-colors duration-200" />
                      <span className="font-medium">{item.label}</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <ChevronDown className="h-4 w-4 -rotate-90 text-accent" />
                      </div>
                    </Link>
                  ))}
                </div>

                {/* User Menu */}
                {isAuthenticated ? (
                  <div className="mb-6">
                    <h4 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3 px-2">
                      Account
                    </h4>
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-accent/10 hover:to-blue-500/10 transition-all duration-200 rounded-xl group"
                      >
                        <item.icon className="h-5 w-5 mr-4 group-hover:text-accent transition-colors duration-200" />
                        <span className="font-medium">{item.label}</span>
                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <ChevronDown className="h-4 w-4 -rotate-90 text-accent" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="p-6 border-t border-white/10 space-y-4 flex-shrink-0">
              {isAuthenticated ? (
                <Button
                  className="w-full bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform duration-200" />
                  Sign Out
                </Button>
              ) : (
                <Button asChild className="w-full bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Sparkles className="h-4 w-4 mr-3 group-hover:animate-spin transition-all duration-300" />
                    Get Started
                  </Link>
                </Button>
              )}
              <div className="text-center">
                <p className="text-white/40 text-xs">
                  © {new Date().getFullYear()} Learnova. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
