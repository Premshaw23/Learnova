/**
 * lib/storage.js
 * Safe localStorage utilities to prevent application crashes caused by:
 * - Disabled storage (Safari Private Browsing, etc.)
 * - Quota exceeded errors
 * - Malformed JSON data
 */

export const safeParseJSON = (jsonString, fallback = null) => {
  try {
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    console.warn("Failed to parse JSON string safely:", error);
    return fallback;
  }
};

export const safeLocalStorageGet = (key, fallback = null) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;

    const parsed = safeParseJSON(item, fallback);
    return parsed;
  } catch (error) {
    console.warn(`Failed to read from localStorage for key "${key}":`, error);
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors when trying to remove a corrupted key
    }
    return fallback;
  }
};

export const safeLocalStorageSet = (key, value) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    const serialized = JSON.stringify(value);
    window.localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Failed to write to localStorage for key "${key}":`, error);
    if (
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED"
    ) {
      console.warn("Storage quota exceeded. Clearing old data might be necessary.");
    }
    return false;
  }
};
