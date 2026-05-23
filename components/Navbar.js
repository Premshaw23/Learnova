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

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user, userProfile, signOut, isAuthenticated } = useAuthContext();

  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => {  
      setScrollProgress(Math.min(window.scrollY / 100, 1));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && event.target && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
      setIsNotificationOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
    await signOut();
  };

  const getUserInitials = (name) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";
  const getUserDisplayName = () => userProfile?.fullName || user?.displayName || user?.email?.split("@")[0] || "User";
  const getUserPhoto = () => user?.photoURL || null;
  const getUserRole = () => userProfile?.role ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) : "User";

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

  return (
    <>
      <div className="fixed w-full top-0 left-0 right-0 z-[70] px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300">
        <nav
          className={`max-w-7xl mx-auto backdrop-blur-md rounded-2xl border transition-all duration-300 ${
            scrollProgress > 0 
              ? "bg-white/90 dark:bg-zinc-950/70 shadow-lg shadow-gray-200/80 dark:shadow-black/30 border-gray-200 dark:border-zinc-800/60 py-2 px-6" 
              : "bg-white/95 dark:bg-zinc-950/40 shadow-md shadow-gray-100/60 dark:shadow-none border-gray-200/70 dark:border-zinc-900/40 py-3.5 px-6"
          }`}
        >
          <div className="flex justify-between items-center h-14">
            
            {/* Logo Group (Readability Maximized) */}
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

            {/* Center Navigation Capsule (Bold Typography Integration) */}
            <div className="hidden sm:flex items-center space-x-1 bg-zinc-100/80 dark:bg-zinc-900/50 border border-zinc-200/30 dark:border-zinc-800/30 rounded-2xl p-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-bold tracking-wide px-5 py-2 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-white shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right Group Actions */}
            <div className="hidden sm:flex items-center space-x-4">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex items-center space-x-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
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

                  {/* Profile Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors">
                      <div className="relative w-8 h-8">
                        {getUserPhoto() ? (
                          <Image src={getUserPhoto()} alt="Profile" width={32} height={32} className="rounded-full object-cover" />
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

            {/* Mobile Menu Action */}
            <div className="sm:hidden">
              <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-zinc-600 dark:text-zinc-400 px-1">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>

          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[85]" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed top-4 right-4 max-w-[85vw] w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-2xl shadow-xl p-4 space-y-4 z-[90] flex flex-col transition-all">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-2">
              <span className="font-bold text-sm text-zinc-400 uppercase tracking-wider">Menu</span>
              <X className="h-5 w-5 text-zinc-400 cursor-pointer" onClick={() => setIsMenuOpen(false)} />
            </div>
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="px-3 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                  {item.label}
                </Link>
              ))}
            </div>
            {!isAuthenticated && (
              <Button asChild size="default" className="w-full bg-blue-600 text-white rounded-lg text-sm h-10">
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>Login / Signup</Link>
              </Button>
            )}
          </div>
        </>
      )}
    </>
  );
}