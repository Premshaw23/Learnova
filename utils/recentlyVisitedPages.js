import { safeLocalStorageGet, safeLocalStorageSet } from "@/lib/storage";
import { normalizePath } from "@/lib/navigation";

const STORAGE_KEY = "learnova_recently_visited_pages";
const MAX_RECENT_PAGES = 5;

const FALLBACK_PAGE_NAME = "Untitled Page";

function normalizeName(name, path) {
  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  if (path === "/") return "Home";

  return (
    path
      .split("/")
      .filter(Boolean)
      .map((segment) => segment.replace(/[-_]/g, " "))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ") || FALLBACK_PAGE_NAME
  );
}

function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .map((entry) => {
      const path = normalizePath(entry?.path);
      if (!path) return null;

      return {
        path,
        name: normalizeName(entry?.name, path),
        timestamp:
          typeof entry?.timestamp === "number" &&
          Number.isFinite(entry.timestamp)
            ? entry.timestamp
            : 0,
      };
    })
    .filter(Boolean);
}

export function getRecentlyVisitedPages() {
  const stored = safeLocalStorageGet(STORAGE_KEY, []);
  return sanitizeEntries(stored).slice(0, MAX_RECENT_PAGES);
}

export function addRecentlyVisitedPage(page) {
  const path = normalizePath(page?.path);
  if (!path) return getRecentlyVisitedPages();

  const name = normalizeName(page?.name, path);
  const timestamp =
    typeof page?.timestamp === "number" && Number.isFinite(page.timestamp)
      ? page.timestamp
      : Date.now();

  const existing = getRecentlyVisitedPages();
  const deduped = existing.filter((entry) => entry.path !== path);
  const updated = [{ path, name, timestamp }, ...deduped].slice(
    0,
    MAX_RECENT_PAGES
  );

  safeLocalStorageSet(STORAGE_KEY, updated);
  return updated;
}

export function clearRecentlyVisitedPages() {
  safeLocalStorageSet(STORAGE_KEY, []);
}

export const RECENTLY_VISITED_PAGES_STORAGE_KEY = STORAGE_KEY;
