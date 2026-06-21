/**
 * Formats a duration in seconds into a HH:MM:SS string.
 * If input is invalid, negative, or not a number, defaults to "00:00:00".
 * 
 * @param {number} seconds - The time duration in seconds.
 * @returns {string} The formatted time string (HH:MM:SS).
 */
export function formatTimestamp(seconds) {
  if (typeof seconds !== "number" || isNaN(seconds) || seconds < 0) {
    return "00:00:00";
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const pad = (num) => String(num).padStart(2, "0");

  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}
