const STRENGTH_LEVELS = [
  { label: "Very Weak", barClass: "bg-red-600", textClass: "text-red-500", width: "20%" },
  { label: "Weak", barClass: "bg-red-500", textClass: "text-red-400", width: "40%" },
  { label: "Fair", barClass: "bg-orange-500", textClass: "text-orange-400", width: "60%" },
  { label: "Strong", barClass: "bg-yellow-500", textClass: "text-yellow-400", width: "80%" },
  { label: "Very Strong", barClass: "bg-green-500", textClass: "text-green-400", width: "100%" },
];

/**
 * Scores a password's strength on a 0–4 scale based on length, case, digit, and symbol criteria.
 * @param {string} [password=''] - The password string to evaluate.
 * @returns {{ score: number, label: string, barClass: string, textClass: string, width: string }}
 *   An object with a numeric score and Tailwind CSS classes for rendering a strength indicator.
 */
export function getPasswordStrength(password = "") {
  if (!password) {
    return { score: 0, ...STRENGTH_LEVELS[0], width: "0%" };
  }

  let score = 0;
  
  // 1. Length requirement
  if (password.length >= 8) score += 1;
  
  // 2. Contains uppercase and lowercase letters
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  
  // 3. Contains digits
  if (/\d/.test(password)) score += 1;
  
  // 4. Contains special symbols
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  // Clamp index safely between 0 and 4
  const targetIndex = Math.max(0, Math.min(score, 4));
  const level = STRENGTH_LEVELS[targetIndex];

  return { score, ...level };
}