"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  Calendar,
  Info,
  Mail,
  Bell,
  UserCheck,
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import Image from "next/image";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userProfile, signOut, isAuthenticated } = useAuthContext();
  const dropdownRef = useRef(null);
  const pathname = usePathname();

  // Handle scroll effect for transparency
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollProgressValue = Number.isFinite(scrollProgress) ? scrollProgress : 0;


  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const progress = Math.min(window.scrollY / 100, 1);
      setScrollProgress(progress);
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // FIXED: Close dropdown when clicking outside - proper contains() check
  const handleClickOutside = useCallback((event) => {
    if (
      dropdownRef.current &&
      event.target &&
      !dropdownRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  //Fixed Add ESC Key Support
  useEffect(() => {
  const handleEscape = (event) => {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  window.addEventListener("keydown", handleEscape);
  return () => window.removeEventListener("keydown", handleEscape);
}, []);



  // FIXED: Body scroll management with class-based approach
  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    // Cleanup
    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

 
  const handleLogout = async () => {
  setIsDropdownOpen(false);
  setIsMenuOpen(false);
  await signOut();
};

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get user display name safely - prioritize userProfile over user
  const getUserDisplayName = () => {
    if (userProfile?.fullName) return userProfile.fullName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  // Get user profile image safely
  const getUserPhoto = () => {
    return user?.photoURL || null;
  };

  // Get user role for display
  const getUserRole = () => {
    if (!userProfile?.role) return "User";

    // Capitalize first letter
    return userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1);
  };

  // Get dashboard link based on user role
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

  // Navigation items with icons
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
  ].filter((item) => !(item.key === "dashboard" && item.href === "/profile"));

  // FIXED: Image error handler with proper fallback management
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
      {/* Premium gradient background overlay - Fades out as we scroll down to let glassmorphism shine */}
       <div className="fixed w-full top-0 z-[60] h-24 bg-gradient-to-b from-black/60 via-black/10 to-transparent pointer-events-none transition-opacity duration-300" 
           style={{ opacity: 1 - scrollProgressValue * 0.5 }} />

      <nav
        className={`fixed w-full top-0 left-0 right-0 z-[70] transition-all duration-300 ease-out`}
        style={{
          backgroundColor: `rgba(0, 0, 0, ${scrollProgressValue * 0.4})`,
          backdropFilter: `blur(${scrollProgressValue * 24}px)`,
          WebkitBackdropFilter: `blur(${scrollProgressValue * 24}px)`,
          borderBottom: `1px solid rgba(255, 255, 255, ${scrollProgressValue * 0.1})`,
          paddingTop: `${0.5 - scrollProgressValue * 0.5}rem`,
          paddingBottom: `${0.5 - scrollProgressValue * 0.5}rem`,
        }}
      >
        {/* Premium shimmer effect - FIXED: Using CSS classes instead of inline styles */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer opacity-0 hover:opacity-100 transition-opacity duration-1000" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            {/* Enhanced Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 group relative"
            >
              <div className="relative transform transition-all duration-300 group-hover:scale-110">
                <div className="absolute inset-0 bg-gradient-to-r from-accent via-blue-500 to-purple-500 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-all duration-300 animate-pulse" />
                <div className="relative bg-gradient-to-br from-accent to-blue-500 p-2 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:shadow-accent/50 transition-all duration-300">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400 opacity-0 group-hover:opacity-100 transition-all duration-300 animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-white via-accent to-blue-400 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                  Learnova
                </span>
                <span className="text-xs text-white/50 font-medium tracking-widest uppercase transition-all duration-300">
                  Premium
                </span>
              </div>
            </Link>

            {/* Enhanced Desktop Navigation - FIXED: Removed inline animation styles */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-4 py-2 font-medium group overflow-hidden rounded-lg transition-all duration-300
                ${isActive
                        ? "text-white bg-gradient-to-r from-accent/30 to-blue-500/30"
                        : "text-white/80 hover:text-white"
                      } `}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg" />
                    <div
                      className={`absolute bottom-0 h-0.5 bg-gradient-to-r from-accent to-blue-500 transition-all duration-300 ${isActive
                          ? "left-0 w-full"
                          : "left-1/2 w-0 group-hover:left-0 group-hover:w-full"
                        } `}
                    />
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-lg animate-pulse" />
                  </Link>
                );
              })}
              {/* Enhanced Auth Section */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 md:space-x-4 ml-2 md:ml-6">
                  <Link href="/attendance" className="hidden md:block">
                    <Button className="relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Mark Attendance
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Button>
                  </Link>
                  <Link href="/notices" className="hidden lg:block">
                    <Button className="relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Notice Board
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Button>
                  </Link>

                  {/* Enhanced User Dropdown */}
                  <div className="relative" ref={dropdownRef}>

                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                      aria-label="User menu"
                      className="flex items-center space-x-3 p-2 rounded-xl text-white hover:text-accent transition-all duration-300 group hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      <div className="relative">
                        {/* FIXED: Better image fallback structure */}
                        <div className="w-10 h-10 relative">
                          {getUserPhoto() && (
                            <Image
                              src={getUserPhoto()}
                              alt="Profile"
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full border-2 border-accent/50 object-cover"
                              onError={handleImageError}
                            />
                          )}
                          {/*Fixed dropdown avatar class*/}

                          {!getUserPhoto() && (
                            <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {getUserInitials(getUserDisplayName())}
                            </span>
                          </div>
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                      </div>
                      <div className="hidden md:block">
                        <p className="text-sm font-medium">
                          {getUserDisplayName()}
                        </p>
                        <p className="text-xs text-white/60">{getUserRole()}</p>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : ""
                          } `}
                      />
                    </button>

                    {/* Enhanced Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 min-w-64 bg-black/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 py-2 z-52 animate-slideInFromTop">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl" />

                        <div className="relative px-4 py-4 border-b border-white/10">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 relative">
                              {getUserPhoto() && (
                                <Image
                                  src={getUserPhoto()}
                                  alt="Profile"
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-full border-2 border-accent/50 object-cover shadow-lg"
                                  onError={handleImageError}
                                />
                              )}
                              <div
                                className={`fallback-avatar absolute inset-0 w-12 h-12 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center border-2 border-accent/50 shadow-lg ${getUserPhoto() ? "hidden" : "flex"
                                  } `}
                              >
                                <span className="text-sm font-bold text-white">
                                  {getUserInitials(getUserDisplayName())}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">
                                {getUserDisplayName()}
                              </p>
                              <p className="text-xs text-white/60 break-all max-w-[180px] truncate">
                                {user?.email || ""}
                              </p>
                              <div className="flex items-center mt-1">
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1" />
                                <span className="text-xs text-yellow-400 font-medium">
                                  {getUserRole()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative py-2">
                          {userMenuItems.map((item) => (
                            <Link
                              key={item.key}
                              href={item.href}
                              className="flex items-center px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-gradient-to-r hover:from-accent/10 hover:to-blue-500/10 transition-all duration-200 group"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <item.icon className="h-4 w-4 mr-3 group-hover:text-accent transition-colors duration-200" />
                              {item.label}
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <ChevronDown className="h-3 w-3 -rotate-90" />
                              </div>
                            </Link>
                          ))}

                          <hr className="my-2 border-white/10" />

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
                          >
                            <LogOut className="h-4 w-4 mr-3 group-hover:text-red-300 transition-colors duration-200" />
                            Logout
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <ChevronDown className="h-3 w-3 -rotate-90" />
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ml-2 md:ml-6">
                  <Link href="/auth">
                    <Button className="relative bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover:scale-105 group overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center">
                        Login / Signup
                        <Sparkles className="ml-2 h-4 w-4 transition-all duration-300" />
                      </span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Enhanced Mobile menu button with User Logo - FIXED: Changed breakpoint to sm:hidden */}
            <div className="md:hidden flex items-center space-x-3">
              {isAuthenticated && (
                <div className="relative">
                  <div className="w-9 h-9 relative">
                    {getUserPhoto() && (
                      <Image
                        src={getUserPhoto()}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-full border-2 border-accent/50 object-cover shadow-md"
                        onError={handleImageError}
                      />
                    )}
                    <div
                      className={`fallback-avatar absolute inset-0 w-9 h-9 rounded-full bg-gradient-to-br from-accent via-blue-500 to-purple-500 flex items-center justify-center border-2 border-accent/50 shadow-md ${getUserPhoto() ? "hidden" : "flex"
                        } `}
                    >
                      <span className="text-xs font-bold text-white">
                        {getUserInitials(getUserDisplayName())}
                      </span>
                    </div>
                  </div>
                  {/* Status indicator (green dot) */}
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-black animate-pulse" />
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white hover:text-accent hover:bg-white/10 transition-all duration-300 hover:scale-110 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded" />
                {isMenuOpen ? (
                  <X className="h-7 text-2xl w-7 relative z-10" />
                ) : (
                  <Menu className="h-7 w-7 relative z-10" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Overlay - FIXED: Using CSS classes instead of inline styles */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-49 md:hidden animate-fadeIn"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Right Side Panel */}
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-black/95 via-gray-900/95 to-black/95 backdrop-blur-2xl border-l border-white/20 z-52 md:hidden shadow-2xl flex flex-col animate-slideInRight">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="relative bg-gradient-to-br from-accent to-blue-500 p-2 rounded-xl shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Learnova</h2>
                  <p className="text-xs text-white/50 uppercase tracking-wider">
                    Menu
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
              >
                <X className="h-7 w-7" />
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
                  <Link href="/attendance" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-accent/90 to-blue-500/90 hover:from-accent hover:to-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Attendance
                    </Button>
                  </Link>
                  <Link href="/notices" onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-purple-500/90 to-pink-500/90 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200">
                      <Bell className="h-4 w-4 mr-2" />
                      Notices
                    </Button>
                  </Link>
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
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-accent to-blue-500 hover:from-accent/90 hover:to-blue-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <Sparkles className="h-4 w-4 mr-3 group-hover:animate-spin transition-all duration-300" />
                    Get Started
                  </Button>
                </Link>
              )}
              <div className="text-center">
                <p className="text-white/40 text-xs">
                  © 2024 Learnova. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
   .overflow-hidden {
  overflow: hidden !important;
}
  
 @keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(200%) skewX(-12deg);
  }
}

@keyframes fadeIn {
          from {
    opacity: 0;
  }
          to {
    opacity: 1;
  }
}
        .animate-fadeIn {
  animation: fadeIn 0.2s ease-out;
}

@keyframes slideInRight {
          from {
    transform: translateX(100%);
  }
          to {
    transform: translateX(0);
  }
}
        .animate-slideInRight {
  animation: slideInRight 0.2s ease-out;
}

@keyframes slideInFromTop {
          from {
    opacity: 0;
    transform: translateY(-8px);
  }
          to {
    opacity: 1;
    transform: translateY(0);
  }
}
        .animate-slideInFromTop {
  animation: slideInFromTop 0.2s ease-out;
}

        /* Animation delay classes */
.animate-fadeIn-0 {
  animation: fadeIn 0.2s ease-out 0ms both;
}

.animate-fadeIn-1 {
  animation: fadeIn 0.2s ease-out 100ms both;
}

.animate-fadeIn-2 {
  animation: fadeIn 0.2s ease-out 200ms both;
}

.animate-fadeIn-delay-0 {
  animation: fadeIn 0.2s ease-out 0ms both;
}

.animate-fadeIn-delay-1 {
  animation: fadeIn 0.2s ease-out 50ms both;
}

.animate-fadeIn-delay-2 {
  animation: fadeIn 0.2s ease-out 100ms both;
}
`}</style>
    </>
  );
}
