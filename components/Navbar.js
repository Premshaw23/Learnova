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
  Keyboard,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Hook Integration: Connects actual hooks & destructured operations
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  const { user, userProfile, signOut, isAuthenticated } = useAuthContext();

  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefersDark, setPrefersDark] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light") return false;
      if (saved === "dark") return true;
      return (
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect system preference on mount so initial render matches user's OS
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const update = (e) => setPrefersDark(e.matches);
      if (mq.addEventListener) mq.addEventListener("change", update);
      else mq.addListener && mq.addListener(update);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", update);
        else mq.removeListener && mq.removeListener(update);
      };
    } catch (e) {
      // ignore
    }
  }, []);

  const scrollProgressValue = Number.isFinite(scrollProgress) ? scrollProgress : 0;

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => {  
      const progress = Math.min(window.scrollY / 100, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
  }, [pathname]);

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

  const getUserPhoto = () => user?.photoURL || null;

  const getUserRole = () => {
    if (!userProfile?.role) return "User";
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  const getDashboardLink = () => {
    if (!userProfile?.role) return "/profile";
    switch (userProfile.role) {
      case "student": return "/student/dashboard";
      case "teacher": return "/teacher/dashboard";
      case "institute": return "/institute/dashboard";
      case "admin": return "/admin/dashboard";
      default: return "/profile";
    }
  };

  const navigationItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/activity", label: "Activities", icon: Activity },
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

  return (
    <>
      {/* Background Dimming Layer on Scroll */}
      <div
        className="fixed w-full top-0 z-[60] h-24 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none transition-opacity duration-300"
        style={{ opacity: 1 - scrollProgressValue * 0.5 }}
      />

      {/* Main Navbar */}
      <nav
        className="fixed w-full top-0 left-0 right-0 z-[70] transition-all duration-300 ease-out"
        style={{
          // Use resolved theme when mounted; otherwise fall back to system preference
          backgroundColor:
            (mounted ? theme : prefersDark ? "dark" : "light") === "dark"
              ? `rgba(0,0,0,${0.82 + scrollProgressValue * 0.12})`
              : `rgba(255,255,255,0.98)`,
          backdropFilter: `blur(20px)`,
          WebkitBackdropFilter: `blur(20px)`,
          borderBottom:
            (mounted ? theme : prefersDark ? "dark" : "light") === "dark"
              ? `1px solid rgba(255,255,255,0.1)`
              : `1px solid rgba(0,0,0,0.08)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Group */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-accent to-blue-500 p-2 rounded-xl">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-950 dark:text-white">
                  Learnova
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider font-semibold">
                  Premium
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Control */}
            <div className="hidden sm:flex items-center space-x-2">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-accent/20 text-gray-950 dark:text-white font-medium"
                        : "text-gray-700 dark:text-gray-200 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Theme Selector Button */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-xl text-gray-800 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}

              {/* Authentication Actions View */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 sm:space-x-4 ml-2 sm:ml-6">
                  <Button asChild className="hidden sm:block relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
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

                  {/* Notifications Overlay Node */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative p-2 rounded-xl text-gray-800 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl z-[52] overflow-hidden">
                        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
                          <h3 className="text-foreground font-semibold text-sm">
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              aria-label="Mark all notifications as read"
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="p-6 text-center">
                              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                              <p className="text-muted-foreground text-sm">
                                No notifications available
                              </p>
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n.id}
                                onClick={() => markAsRead(n.id)}
                                className={`p-4 border-b border-border/60 cursor-pointer transition-colors hover:bg-muted/40 ${
                                  !n.read ? "bg-accent/5 dark:bg-accent/10" : ""
                                }`}
                              >
                                <p className="text-sm text-foreground">
                                  {n.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {n.time}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Menu Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl text-gray-800 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300"
                    >
                      <div className="relative w-10 h-10">
                        {getUserPhoto() ? (
                          <Image
                            src={getUserPhoto()}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full object-cover border-2 border-accent/50"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {getUserInitials(getUserDisplayName())}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-foreground">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getUserRole()}
                        </p>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 min-w-64 bg-background border border-border rounded-2xl shadow-2xl py-2 z-[52]">
                        {userMenuItems.map((item) => (
                          <Link
                            key={item.key}
                            href={item.href}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center px-4 py-3 text-sm text-muted-foreground hover:bg-accent/10 hover:text-foreground transition-colors"
                          >
                            <item.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                            {item.label}
                          </Link>
                        ))}
                        <hr className="my-2 border-border" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ml-2 sm:ml-6">
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

            {/* Mobile View Toggle Control Trigger */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Toggle Menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-800 dark:text-gray-100 hover:text-accent hover:bg-accent/10 transition-all duration-300"
              >
                {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Context Drawer Menu */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[49] md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-background text-foreground z-[52] md:hidden border-l border-border shadow-2xl flex flex-col justify-between">
            <div>
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-foreground text-lg font-bold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Close menu"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* User Identity Display Node (Mobile) */}
              {isAuthenticated && (
                <div className="p-6 border-b border-border">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-14 h-14 relative">
                      {getUserPhoto() && (
                        <Image
                          src={getUserPhoto()}
                          alt="Profile"
                          width={56}
                          height={56}
                          className="rounded-full border-2 border-accent/50 object-cover shadow-lg"
                          onError={handleImageError}
                        />
                      )}
                      <div
                        className={`fallback-avatar absolute inset-0 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center border-2 border-accent/50 shadow-lg ${
                          getUserPhoto() ? "hidden" : "flex"
                        }`}
                      >
                        <span className="text-lg font-bold text-white">
                          {getUserInitials(getUserDisplayName())}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground font-semibold text-base truncate">
                        {getUserDisplayName()}
                      </h3>
                      <p className="text-muted-foreground text-sm truncate">
                        {user?.email || ""}
                      </p>
                      <div className="flex items-center mt-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2" />
                        <span className="text-xs text-yellow-500 font-medium">
                          {getUserRole()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Quick Actions (Mobile) */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button asChild className="w-full bg-muted text-foreground hover:bg-muted/80 text-sm font-medium border border-border">
                      <Link href="/attendance" onClick={() => setIsMenuOpen(false)}>
                        <UserCheck className="h-4 w-4 mr-2 text-accent" />
                        Attendance
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-muted text-foreground hover:bg-muted/80 text-sm font-medium border border-border">
                      <Link href="/notices" onClick={() => setIsMenuOpen(false)}>
                        <Bell className="h-4 w-4 mr-2 text-purple-500" />
                        Notices
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Mobile Core Navigation List */}
              <div className="p-4 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                    Navigation
                  </h4>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center px-4 py-3 hover:bg-accent/10 transition-colors rounded-xl group"
                    >
                      <item.icon className="h-5 w-5 mr-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                {isAuthenticated && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                      Account
                    </h4>
                    {userMenuItems.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center px-4 py-3 hover:bg-accent/10 transition-colors rounded-xl group"
                      >
                        <item.icon className="h-5 w-5 mr-4 text-muted-foreground group-hover:text-accent transition-colors" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Footer Area Layout Container */}
            <div className="p-6 border-t border-border space-y-4">
              {isAuthenticated ? (
                <Button
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium shadow-lg transition-all"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              ) : (
                <Button asChild className="w-full bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg transition-all">
                  <Link href="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>
                    <Sparkles className="h-4 w-4 mr-3" />
                    Get Started
                  </Link>
                </Button>
              )}
              
              <div className="text-center space-y-3">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"));
                  }}
                  className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-accent transition-colors text-xs font-medium cursor-pointer"
                >
                  <Keyboard className="h-4 w-4 text-accent" />
                  <span>Keyboard Shortcuts</span>
                </button>
                <p className="text-muted-foreground/60 text-[10px]">
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