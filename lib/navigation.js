import {
  Activity,
  ArrowRight,
  BookOpen,
  HeartPulse,
  Home,
  LayoutDashboard,
  Mail,
  MessageSquareWarning,
  Settings,
  Sparkles,
  User,
  UserCheck,
  Bell,
  LogIn,
} from "lucide-react";

export const NAVIGATION_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: BookOpen },
  { href: "/wellness", label: "Wellness", icon: HeartPulse },
  { href: "/productivity", label: "Focus", icon: Sparkles },
  { href: "/activity", label: "Activities", icon: Activity },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/contact", label: "Contact", icon: Mail },
];

const DASHBOARD_ROUTES = [
  "/student/dashboard",
  "/teacher/dashboard",
  "/institute/dashboard",
  "/admin/dashboard",
  "/parent/dashboard",
];

export function normalizePath(pathname) {
  if (typeof pathname !== "string") return "";
  const base = pathname.split(/[?#]/)[0].trim();
  if (!base) return "";
  return base.replace(/\/+$/, "").replace(/^\/?/, "/");
}

function getKnownRouteMatch(pathname) {
  const path = normalizePath(pathname);
  if (!path) return null;

  const exactMatch = NAVIGATION_ITEMS.find((item) => {
    if (item.href === "/") {
      return path === "/";
    }

    return path === item.href || path.startsWith(`${item.href}/`);
  });

  if (exactMatch) return exactMatch;

  if (DASHBOARD_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))) {
    return { href: path, label: "Dashboard", icon: LayoutDashboard };
  }

  if (path === "/auth" || path.startsWith("/auth/")) {
    return { href: path, label: "Sign In", icon: LogIn };
  }

  if (path === "/profile" || path.startsWith("/profile/")) {
    return { href: path, label: "Profile", icon: User };
  }

  if (path === "/settings" || path.startsWith("/settings/")) {
    return { href: path, label: "Settings", icon: Settings };
  }

  if (path === "/attendance" || path.startsWith("/attendance/")) {
    return { href: path, label: "Attendance", icon: UserCheck };
  }

  if (path === "/notices" || path.startsWith("/notices/")) {
    return { href: path, label: "Notice Board", icon: Bell };
  }

  return null;
}

export function getDashboardLink(role) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "teacher":
      return "/teacher/dashboard";
    case "institute":
      return "/institute/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "parent":
      return "/parent/dashboard";
    default:
      return "/profile";
  }
}

export function getRouteDisplayName(pathname, fallback = "") {
  const match = getKnownRouteMatch(pathname);
  if (match) return match.label;

  const path = normalizePath(pathname);
  const cleanedFallback = typeof fallback === "string"
    ? fallback.replace(/\s*\|\s*Learnova$/i, "").trim()
    : "";

  if (cleanedFallback) {
    return cleanedFallback;
  }

  if (!path || path === "/") return fallback || "Home";

  const lastSegment = path.split("/").filter(Boolean).pop() || "";
  const formatted = lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

  return formatted || fallback || "Page";
}

export function getRouteIcon(pathname) {
  const match = getKnownRouteMatch(pathname);
  return match?.icon || ArrowRight;
}

export function getSearchModalItems({ isAuthenticated, role } = {}) {
  const items = [
    { label: "Home", href: "/", category: "Navigation", icon: Home },
    { label: "Activities", href: "/activity", category: "Navigation", icon: Activity },
    { label: "Contact", href: "/contact", category: "Navigation", icon: Mail },
  ];

  if (isAuthenticated) {
    items.push(
      { label: "Dashboard", href: getDashboardLink(role), category: "Account", icon: LayoutDashboard },
      { label: "Profile", href: "/profile", category: "Account", icon: User },
      { label: "Settings", href: "/settings", category: "Account", icon: Settings },
      { label: "Mark Attendance", href: "/attendance", category: "Quick Actions", icon: UserCheck },
      { label: "Notice Board", href: "/notices", category: "Quick Actions", icon: Bell },
    );
  } else {
    items.push({ label: "Login / Signup", href: "/auth", category: "Account", icon: LogIn });
  }

  return items;
}
