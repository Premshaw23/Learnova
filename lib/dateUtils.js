/**
 * lib/dateUtils.js
 *
 * Shared date utilities for consistent timezone-aware date key generation
 * across the attendance system. All attendance date keys MUST use these
 * helpers to prevent UTC/local timezone drift between online and offline flows.
 *
 * Root cause context (Issue #1234):
 *   The client-side `getTodayKey()` used `new Date().toISOString().slice(0,10)` which
 *   yields UTC dates. The server sync route used `Intl.DateTimeFormat("Asia/Kolkata")`
 *   which yields IST dates. Between 12:00 AM and 5:30 AM IST, these produce different
 *   calendar dates, causing duplicate Firestore documents and broken analytics queries.
 */

const DEFAULT_TIMEZONE = "Asia/Kolkata";

/**
 * Derives a YYYY-MM-DD date key from a timestamp, localized to the configured timezone.
 * This ensures that a check-in at 12:30 AM IST is correctly attributed to the IST calendar
 * day rather than the previous UTC day.
 *
 * @param {number|Date} [timestamp=Date.now()] - The moment to derive the date for.
 *   Accepts a Unix-ms number or a Date object.
 * @param {string} [timeZone] - IANA timezone identifier. Defaults to NEXT_PUBLIC_TIMEZONE
 *   env var or "Asia/Kolkata".
 * @returns {string} Date key in YYYY-MM-DD format, localized to the target timezone.
 *
 * @example
 * // At 12:10 AM IST on May 26 (which is May 25 18:40 UTC):
 * getLocalDateKey(Date.parse("2026-05-25T18:40:00Z")); // "2026-05-26"
 */
export function getLocalDateKey(timestamp, timeZone) {
  const tz =
    timeZone ||
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_TIMEZONE) ||
    DEFAULT_TIMEZONE;

  const date =
    timestamp instanceof Date ? timestamp : new Date(timestamp ?? Date.now());

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;

  return `${year}-${month}-${day}`;
}

/**
 * Convenience alias: returns the localized date key for "right now".
 * Drop-in replacement for the old `new Date().toISOString().slice(0, 10)` pattern.
 *
 * @param {string} [timeZone] - Optional IANA timezone override.
 * @returns {string} Today's date in YYYY-MM-DD format, localized.
 */
export function getTodayKeyLocal(timeZone) {
  return getLocalDateKey(Date.now(), timeZone);
}

export function getWeekdaysSince(startDate) {
  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().getFullYear(), 0, 1);
  const end = new Date();
  let weekdays = 0;

  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const weekday = day.getDay();
    if (weekday >= 1 && weekday <= 5) {
      weekdays += 1;
    }
  }

  return Math.max(weekdays, 1);
}
