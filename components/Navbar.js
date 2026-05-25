"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import Image from "next/image";

import { Button } from "@/components/ui/button";

import { useNotifications } from "@/hooks/useNotifications";

import { useTheme } from "next-themes";

import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const languageMap = {
  "English": "en",
  "Español": "es",
  "Français": "fr",
  "Deutsch": "de",
  "हिन्दी": "hi"
};
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
  Languages, // Added for the translation button icon
  Search,
} from "lucide-react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false); // Language dropdown state
  const [currentLang, setCurrentLang] = useState("English"); // Tracks selected language
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { i18n } = useTranslation();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const {
    user,
    userProfile,
    signOut,
    isAuthenticated,
    loading,
  } = useAuthContext();

  const dropdownRef = useRef(null);
  const langRef = useRef(null); // Ref to track language dropdown outside clicks
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [prefersDark, setPrefersDark] = useState(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "light") setPrefersDark(false);
      else if (saved === "dark") setPrefersDark(true);
      else {
        setPrefersDark(
          typeof window.matchMedia === "function" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
        );
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollProgress(Math.min(window.scrollY / 100, 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (
      dropdownRef.current &&
      event.target &&
      !dropdownRef.current.contains(event.target)
    ) {
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
    }
    // Close language selector if clicking outside
    if (
      langRef.current &&
      event.target &&
      !langRef.current.contains(event.target)
    ) {
      setIsLangOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const closeMenus = () => {
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
      setIsMenuOpen(false);
      setIsLangOpen(false);
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeMenus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
    setIsNotificationOpen(false);
    setIsLangOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
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
    { href: "/productivity", label: "Focus", icon: Sparkles },
    { href: "/activity", label: "Activities", icon: Activity },
    { href: "/complaints", label: "Complaints", icon: Mail },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  const userMenuItems = [
    { href: "/profile", icon: User, label: "Profile", key: "profile" },
    { href: getDashboardLink(), icon: Activity, label: "Dashboard", key: "dashboard" },
    { href: "/settings", icon: Settings, label: "Settings", key: "settings" },
  ].filter((item) => !(item.key === "dashboard" && item.href === "/profile"));

  const languagesList = ["English", "Español", "Français", "Deutsch", "हिन्दी"];

  const handleImageError = (e) => {
    const img = e.target;
    const fallback = img.parentElement?.querySelector(".fallback-avatar");
    if (img && fallback) {
      img.style.display = "none";
      fallback.style.display = "flex";
    }
  };

  const scrollProgressValue =
  Number.isFinite(scrollProgress)
    ? scrollProgress
    : 0;
  
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
            (mounted ? resolvedTheme : prefersDark ? "dark" : "light") === "dark"
              ? `rgba(0,0,0,${0.82 + scrollProgressValue * 0.12})`
              : `rgba(255,255,255,0.98)`,
          backdropFilter: `blur(20px)`,
          WebkitBackdropFilter: `blur(20px)`,
          borderBottom:
            (mounted ? resolvedTheme : prefersDark ? "dark" : "light") === "dark"
              ? `1px solid rgba(255,255,255,0.1)`
              : `1px solid rgba(0,0,0,0.08)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo Group */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-blue-600 dark:bg-blue-500 p-2.5 rounded-xl text-white shadow-sm transition-all duration-200 group-hover:scale-102">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 block leading-tight">
                  Learnova
                </span>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-widest font-black mt-0.5 leading-none">
                  Premium
                </p>
              </div>
            </Link>

            {/* Center Navigation Capsule */}
            <div className="hidden sm:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30 rounded-2xl p-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-bold tracking-wide px-5 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-accent/20 text-gray-950 dark:text-white font-medium"
                        : "text-gray-900 dark:text-gray-50 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Group Controls */}
            <div className="hidden sm:flex items-center space-x-3">
              
              {/* Global Search Button */}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("learnova:open-search"))}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-zinc-200/40 dark:border-zinc-800/50 cursor-pointer"
                aria-label="Open search modal"
              >
                <Search className="h-4 w-4 text-zinc-400" />
                <span className="hidden md:inline">Search</span>
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 text-[10px] rounded border border-zinc-200 dark:border-zinc-800 font-mono leading-none">Ctrl K</kbd>
              </button>

              {/* Language Selector Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors border border-zinc-200/40 dark:border-zinc-800/50"
                  aria-label="Select language"
                >
                  <Languages className="h-4 w-4 text-zinc-400" />
                  <span className="hidden md:inline">{currentLang}</span>
               <ChevronDown
  className="h-3.5 w-3.5 text-zinc-400 transition-transform duration-200"
  style={{
    transform: isLangOpen
      ? "rotate(180deg)"
      : "none",
  }}
/></button>

                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-[80]">
                    {languagesList.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setCurrentLang(lang);
                          setIsLangOpen(false);
                          if (i18n && i18n.changeLanguage) {
                            i18n.changeLanguage(languageMap[lang]);
                          }
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          currentLang === lang
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-white font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-xl text-gray-900 dark:text-gray-50 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300 cursor-pointer"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}

              {loading ? (
                <div className="w-24 h-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl" />
              ) : isAuthenticated ? (
                <div className="flex items-center space-x-3 pl-1 border-l border-zinc-200 dark:border-zinc-800">
                  
                  {/* Notifications Module Panel */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative p-2 rounded-xl text-gray-900 dark:text-gray-50 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300 cursor-pointer"
                      aria-label="View notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && <span className="absolute top-2 right-2 bg-red-500 rounded-full h-2 w-2" />}
                    </button>

                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[80] overflow-hidden">
                        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                          <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-zinc-400">No new notices</div>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} onClick={() => markAsRead(n.id)} className={`p-3 text-left cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/40 ${!n.read ? "bg-blue-50/30" : ""}`}>
                                <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2">{n.message}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center space-x-3 p-2 rounded-xl text-gray-800 dark:text-gray-100 hover:text-gray-950 dark:hover:text-white hover:bg-accent/10 transition-all duration-300"
                      aria-label="User profile menu"
                      aria-haspopup="true"
                      aria-expanded={isDropdownOpen}
                    >
                      <div className="relative w-10 h-10">
                        {getUserPhoto() ? (
                          <Image src={getUserPhoto()} alt="Profile" width={32} height={32} className="rounded-full object-cover" onError={handleImageError} />
                        ) : (
                          <div className="absolute inset-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                            {getUserInitials(getUserDisplayName())}
                          </div>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-[80]">
                        {userMenuItems.map((item) => (
                          <Link key={item.key} href={item.href} onClick={() => setIsDropdownOpen(false)} className="flex items-center px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                            <item.icon className="h-4 w-4 mr-2.5 text-zinc-400" /> {item.label}
                          </Link>
                        ))}
                        <hr className="my-1 border-zinc-100 dark:border-zinc-900" />
                        <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                          <LogOut className="h-4 w-4 mr-2.5" /> Logout
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <Button 
                  asChild 
                  size="default" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-5 h-10 text-sm shadow-sm active:scale-98 transition-all"
                >
                  <Link href="/auth">
                    <span className="flex items-center gap-2">
                      Login
                      <Sparkles className="h-4 w-4 text-blue-200" />
                    </span>
                  </Link>
                </Button>
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
                className="text-gray-900 dark:text-gray-50 hover:text-accent hover:bg-accent/10 transition-all duration-300"
              >
                {isMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
              </Button>
            </div>
                  </div>
          </div>
        </nav>

      {/* Mobile Drawer Overlay Architecture */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[85]" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-4 right-4 max-w-[85vw] w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl p-4 space-y-4 z-[90] flex flex-col transition-all">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
              <span className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Menu</span>
              <X className="h-5 w-5 text-zinc-400 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
            </div>
            
            {isAuthenticated && (
              <div className="flex items-center space-x-3 p-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                <div className="relative w-10 h-10 shrink-0">
                  {getUserPhoto() ? (
                    <Image src={getUserPhoto()} alt="Profile" width={40} height={40} className="rounded-full object-cover" onError={handleImageError} />
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                      {getUserInitials(getUserDisplayName())}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">{getUserDisplayName()}</h4>
                  <p className="text-[11px] text-zinc-400 truncate">{getUserRole()}</p>
                </div>
              </div>
            )}

            {/* Mobile Nav Actions */}
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  <item.icon className="h-4 w-4 mr-2.5 text-zinc-400" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Mobile Language Selector */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2 px-1">Language</span>
              <div className="grid grid-cols-2 gap-1.5">
                {languagesList.slice(0, 4).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                          setCurrentLang(lang);
                          setIsMenuOpen(false);
                          if (i18n && i18n.changeLanguage) {
                            i18n.changeLanguage(languageMap[lang]);
                          }
                        }}
                    className={`text-xs p-2 rounded-xl border text-center transition-all ${
                      currentLang === lang
                        ? "bg-blue-600 text-white border-blue-600 font-bold"
                        : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200/60 dark:border-zinc-800/60 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Specific Navigation */}
            {isAuthenticated && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900 space-y-1">
                {userMenuItems.map((item) => (
                  <Link key={item.key} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <item.icon className="h-4 w-4 mr-2.5 text-zinc-400" />
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Primary Action Buttons */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
              {loading ? (
                <div className="w-full h-10 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                <Button onClick={handleLogout} variant="destructive" size="default" className="w-full text-white rounded-lg text-sm h-10">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </Button>
              ) : (
                <Button asChild size="default" className="w-full bg-blue-600 text-white rounded-lg text-sm h-10">
                  <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                    <span className="flex items-center gap-2">
                      Get Started <Sparkles className="h-4 w-4 text-blue-200" />
                    </span>
                  </Link>
                </Button>
              )}
            </div>

            {/* Shortcuts Footer */}
            <div className="text-center space-y-2 pt-1 flex flex-col items-center">
              <div className="flex items-center justify-center gap-4">
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
                <span className="text-zinc-600 dark:text-zinc-800">|</span>
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
              <p className="text-zinc-400/50 text-[10px]">© {new Date().getFullYear()} Learnova.</p>
            </div>

          </div>
        </>
      )}
    </>
  );
}
