import { describe, expect, it } from "vitest";
import {
  getRouteDisplayName,
  getRouteIcon,
  getSearchModalItems,
  normalizePath,
} from "@/lib/navigation";

describe("normalizePath", () => {
  it("strips query strings", () => {
    expect(normalizePath("/contact?ref=up")).toBe("/contact");
  });

  it("strips hash fragments", () => {
    expect(normalizePath("/contact#section")).toBe("/contact");
  });

  it("removes trailing slashes", () => {
    expect(normalizePath("/contact/")).toBe("/contact");
  });

  it("handles multiple trailing slashes", () => {
    expect(normalizePath("/contact///")).toBe("/contact");
  });

  it("ensures leading slash", () => {
    expect(normalizePath("contact")).toBe("/contact");
  });

  it("returns empty string for non-string input", () => {
    expect(normalizePath(null)).toBe("");
    expect(normalizePath(undefined)).toBe("");
    expect(normalizePath(123)).toBe("");
  });

  it("handles root path", () => {
    expect(normalizePath("/")).toBe("/");
  });
});

describe("getRouteDisplayName", () => {
  it("returns known route labels for exact matches", () => {
    expect(getRouteDisplayName("/")).toBe("Home");
    expect(getRouteDisplayName("/about")).toBe("About");
    expect(getRouteDisplayName("/contact")).toBe("Contact");
    expect(getRouteDisplayName("/activity")).toBe("Activities");
    expect(getRouteDisplayName("/wellness")).toBe("Wellness");
    expect(getRouteDisplayName("/productivity")).toBe("Focus");
    expect(getRouteDisplayName("/complaints")).toBe("Complaints");
  });

  it("matches dashboards by role prefix", () => {
    expect(getRouteDisplayName("/student/dashboard")).toBe("Dashboard");
    expect(getRouteDisplayName("/teacher/dashboard")).toBe("Dashboard");
    expect(getRouteDisplayName("/institute/dashboard")).toBe("Dashboard");
    expect(getRouteDisplayName("/admin/dashboard")).toBe("Dashboard");
    expect(getRouteDisplayName("/parent/dashboard")).toBe("Dashboard");
  });

  it("matches auth and profile routes", () => {
    expect(getRouteDisplayName("/auth")).toBe("Sign In");
    expect(getRouteDisplayName("/profile")).toBe("Profile");
    expect(getRouteDisplayName("/settings")).toBe("Settings");
    expect(getRouteDisplayName("/attendance")).toBe("Attendance");
    expect(getRouteDisplayName("/notices")).toBe("Notice Board");
  });

  it("uses last segment fallback for unknown routes", () => {
    expect(getRouteDisplayName("/unknown-page")).toBe("Unknown Page");
  });

  it("uses fallback parameter when provided", () => {
    expect(getRouteDisplayName("/some/unknown", "Custom Title")).toBe("Custom Title");
  });
});

describe("getRouteIcon", () => {
  it("returns an icon component for known routes", () => {
    const icon = getRouteIcon("/");
    expect(icon).toBeDefined();
    expect(icon.$$typeof || typeof icon === "function" || typeof icon === "object").toBeTruthy();
  });

  it("returns the default ArrowRight for unknown routes", () => {
    const icon = getRouteIcon("/unknown/route");
    expect(icon).toBeDefined();
  });
});

describe("getSearchModalItems", () => {
  it("returns Navigation category items for unauthenticated users", () => {
    const items = getSearchModalItems({ isAuthenticated: false });
    const navItems = items.filter((i) => i.category === "Navigation");
    expect(navItems.length).toBeGreaterThan(0);
    expect(navItems.some((i) => i.href === "/")).toBe(true);
    expect(navItems.some((i) => i.href === "/activity")).toBe(true);
    expect(navItems.some((i) => i.href === "/contact")).toBe(true);
  });

  it("includes account items for unauthenticated users", () => {
    const items = getSearchModalItems({ isAuthenticated: false });
    expect(items.some((i) => i.label === "Login / Signup")).toBe(true);
  });

  it("includes dashboard and account items for authenticated users", () => {
    const items = getSearchModalItems({ isAuthenticated: true, role: "student" });
    expect(items.some((i) => i.label === "Dashboard")).toBe(true);
    expect(items.some((i) => i.label === "Profile")).toBe(true);
    expect(items.some((i) => i.label === "Settings")).toBe(true);
    expect(items.some((i) => i.label === "Login / Signup")).toBe(false);
  });

  it("returns the correct dashboard link based on role", () => {
    const studentItems = getSearchModalItems({ isAuthenticated: true, role: "student" });
    const studentDash = studentItems.find((i) => i.label === "Dashboard");
    expect(studentDash?.href).toBe("/student/dashboard");

    const teacherItems = getSearchModalItems({ isAuthenticated: true, role: "teacher" });
    const teacherDash = teacherItems.find((i) => i.label === "Dashboard");
    expect(teacherDash?.href).toBe("/teacher/dashboard");
  });
});
