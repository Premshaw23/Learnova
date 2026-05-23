const STRENGTH_LEVELS = [
  { label: "Weak", barClass: "bg-red-500", textClass: "text-red-400" },
  { label: "Fair", barClass: "bg-orange-500", textClass: "text-orange-400" },
  { label: "Strong", barClass: "bg-yellow-500", textClass: "text-yellow-400" },
  { label: "Very Strong", barClass: "bg-green-500", textClass: "text-green-400" },
];

/**
 * Scores a password's strength on a 0–4 scale based on length, case, digit, and symbol criteria.
 * @param {string} [password=''] - The password string to evaluate.
 * @returns {{ score: number, label: string, barClass: string, textClass: string }}
 *   An object with a numeric score and Tailwind CSS classes for rendering a strength indicator.
 * @example
 * getPasswordStrength('Hello1!');
 * // { score: 3, label: 'Strong', barClass: 'bg-yellow-500', textClass: 'text-yellow-400' }
 * getPasswordStrength('');
 * // { score: 0, label: 'Weak', barClass: 'bg-red-500', textClass: 'text-red-400' }
 */
export function getPasswordStrength(password = "") {
  if (!password) {
    return { score: 0, label: "Weak", barClass: "bg-red-500", textClass: "text-red-400", widthClass: "w-0" };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  let label = "Weak";
  let barClass = "bg-red-500";
  let textClass = "text-red-400";
  let widthClass = "w-1/3";

  if (score >= 4) {
    label = "Strong";
    barClass = "bg-green-500";
    textClass = "text-green-400";
    widthClass = "w-full";
  } else if (score >= 2) {
    label = "Medium";
    barClass = "bg-yellow-500";
    textClass = "text-yellow-400";
    widthClass = "w-2/3";
  }

  return { score, label, barClass, textClass, widthClass };
}
