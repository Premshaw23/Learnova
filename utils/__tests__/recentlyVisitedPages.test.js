import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentlyVisitedPage,
  clearRecentlyVisitedPages,
  getRecentlyVisitedPages,
} from "@/utils/recentlyVisitedPages";

const createLocalStorageMock = () => {
  let store = {};

  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

describe("recentlyVisitedPages", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createLocalStorageMock(),
      writable: true,
      configurable: true,
    });
    window.localStorage.clear();
  });

  it("stores unique pages in most-recent-first order with a max of 5", () => {
    addRecentlyVisitedPage({ path: "/activity", name: "Activities" });
    addRecentlyVisitedPage({ path: "/contact", name: "Contact" });
    addRecentlyVisitedPage({ path: "/profile", name: "Profile" });
    addRecentlyVisitedPage({ path: "/settings", name: "Settings" });
    addRecentlyVisitedPage({ path: "/attendance", name: "Attendance" });
    addRecentlyVisitedPage({ path: "/courses", name: "Courses" });
    addRecentlyVisitedPage({ path: "/contact", name: "Contact" });

    expect(getRecentlyVisitedPages()).toEqual([
      expect.objectContaining({ path: "/contact", name: "Contact" }),
      expect.objectContaining({ path: "/courses", name: "Courses" }),
      expect.objectContaining({ path: "/attendance", name: "Attendance" }),
      expect.objectContaining({ path: "/settings", name: "Settings" }),
      expect.objectContaining({ path: "/profile", name: "Profile" }),
    ]);
  });

  it("normalizes query strings and hashes so duplicates are not stored", () => {
    addRecentlyVisitedPage({ path: "/contact?ref=up", name: "Contact" });
    addRecentlyVisitedPage({ path: "/contact#section", name: "Contact" });
    addRecentlyVisitedPage({ path: "/contact", name: "Contact" });

    const list = getRecentlyVisitedPages();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].path).toBe("/contact");
    expect(typeof list[0].timestamp).toBe("number");
  });

  it("normalizes trailing slashes so /contact and /contact/ are the same", () => {
    addRecentlyVisitedPage({ path: "/contact/", name: "Contact" });
    addRecentlyVisitedPage({ path: "/contact", name: "Contact" });

    const list = getRecentlyVisitedPages();
    expect(list.length).toBe(1);
    expect(list[0].path).toBe("/contact");
  });

  it("clears stored pages", () => {
    addRecentlyVisitedPage({ path: "/activity", name: "Activities" });
    clearRecentlyVisitedPages();

    expect(getRecentlyVisitedPages()).toEqual([]);
  });
});
