"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Home, 
  Activity, 
  Mail, 
  LayoutDashboard, 
  User, 
  Settings, 
  UserCheck, 
  Bell, 
  LogIn, 
  ArrowRight,
  X
} from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

const getIcon = (label) => {
  switch (label) {
    case "Home": return Home;
    case "Activities": return Activity;
    case "Contact": return Mail;
    case "Dashboard": return LayoutDashboard;
    case "Profile": return User;
    case "Settings": return Settings;
    case "Mark Attendance": return UserCheck;
    case "Notice Board": return Bell;
    case "Login / Signup": return LogIn;
    default: return ArrowRight;
  }
};

export default function SearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const { userProfile, isAuthenticated } = useAuthContext();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Setup debounce timer for keystroke throttling (300ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Available interactive quick-filters
  const categoriesList = ["All", "Navigation", "Account", "Quick Actions"];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

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

  const items = useMemo(() => {
    const list = [
      { label: "Home", href: "/", category: "Navigation" },
      { label: "Activities", href: "/activity", category: "Navigation" },
      { label: "Contact", href: "/contact", category: "Navigation" },
    ];

    if (isAuthenticated) {
      list.push(
        { label: "Dashboard", href: getDashboardLink(), category: "Account" },
        { label: "Profile", href: "/profile", category: "Account" },
        { label: "Settings", href: "/settings", category: "Account" },
        { label: "Mark Attendance", href: "/attendance", category: "Quick Actions" },
        { label: "Notice Board", href: "/notices", category: "Quick Actions" }
      );
    } else {
      list.push({ label: "Login / Signup", href: "/auth", category: "Account" });
    }

    return list;
  }, [isAuthenticated, userProfile]);

  
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;

      const matchesSearch = !debouncedQuery.trim() || 
        item.label.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [debouncedQuery, selectedCategory, items]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setQuery("");
      setSelectedCategory("All"); // Clears category pills on open
    }
  }, [isOpen])

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleNavigate(filteredItems[selectedIndex].href);
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleNavigate = (href) => {
    router.push(href);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-start justify-center p-4 pt-[15vh] transition-all duration-300 ease-out ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search"
    >
      <div
        ref={modalRef}
        className={`bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300 ease-out transform ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Area */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages and actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-base"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* ==================== CATEGORY FILTER PILLS ==================== */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-2 bg-slate-950/20 border-b border-white/5">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                selectedCategory === cat
                 ? "bg-blue-600 text-white shadow"
                 : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              {cat}
            </button>
         ))}
       </div>

        {/* Results List */}
        <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
          {/* === REPLACE THE OLD ZERO RESULTS STRING WITH THIS INTERACTIVE CARD === */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
              <Search className="h-8 w-8 text-white/20 mb-2 stroke-[1.5]" />
              <div className="text-white/60 text-sm font-medium mb-1">No matches found</div>
              <p className="text-white/30 text-xs max-w-[240px] mb-4">
                We couldn't find items matching your filters. Try clearing your settings.
              </p>
              <button
                onClick={() => { setQuery(""); setSelectedCategory("All"); }}
                className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = getIcon(item.label);
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNavigate(item.href)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleNavigate(item.href);
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 focus:outline-none focus:bg-accent/20 focus:text-foreground ${
                    isSelected 
                      ? "bg-accent/20 text-foreground" 
                      : "text-white/70 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-accent/10" : "bg-white/5"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-xs text-white/30 uppercase tracking-wider font-mono">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="bg-slate-950/50 px-4 py-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/40">
          <div className="flex items-center gap-2">
            <span>Navigate:</span>
            <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↑↓</span>
            <span>Select:</span>
            <span className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">Enter</span>
          </div>
          <div>Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">Esc</kbd> to close</div>
        </div>
      </div>
    </div>
  );
}
