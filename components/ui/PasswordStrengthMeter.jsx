import React from "react";

/**
 * A premium PasswordStrengthMeter component built with React and Tailwind CSS.
 * Dynamically evaluates a password's strength based on:
 * - Minimum 8 characters length
 * - At least one uppercase letter
 * - At least one numeric digit
 * - At least one special symbol
 * Displays a multi-level color-changing bar and lists individual criteria validation live.
 */
const PasswordStrengthMeter = ({ password = "" }) => {
  const getCriteria = (pwd) => {
    return [
      { id: "length", label: "At least 8 characters", met: pwd.length >= 8 },
      {
        id: "uppercase",
        label: "One uppercase letter",
        met: /[A-Z]/.test(pwd),
      },
      { id: "number", label: "One number", met: /[0-9]/.test(pwd) },
      {
        id: "special",
        label: "One special character (!@#$%^&*)",
        met: /[^A-Za-z0-9]/.test(pwd),
      },
    ];
  };

  const criteria = getCriteria(password);
  const metCount = criteria.filter((c) => c.met).length;

  // Strength Level Definitions
  const getStrengthLevel = (score, length) => {
    if (length === 0)
      return {
        label: "Empty",
        color: "bg-slate-200 dark:bg-slate-800",
        width: "w-0",
        textColor: "text-slate-400",
      };
    if (score <= 1)
      return {
        label: "Weak",
        color: "bg-rose-500",
        width: "w-1/4",
        textColor: "text-rose-500",
      };
    if (score <= 3)
      return {
        label: "Medium",
        color: "bg-amber-500",
        width: "w-3/4",
        textColor: "text-amber-500",
      };
    return {
      label: "Strong",
      color: "bg-emerald-500",
      width: "w-full",
      textColor: "text-emerald-500",
    };
  };

  const strength = getStrengthLevel(metCount, password.length);

  return (
    <div className="space-y-3 w-full transition-all duration-300">
      {/* Strength Bar Indicator */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-500 dark:text-slate-400">
            Password Strength
          </span>
          <span
            className={`transition-colors duration-300 ${strength.textColor}`}
          >
            {strength.label}
          </span>
        </div>

        {/* Track Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* Active Filling Bar */}
          <div
            className={`h-full ${strength.color} transition-all duration-500 ease-out ${strength.width}`}
          />
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        {criteria.map((item) => (
          <div
            key={item.id}
            className="flex items-center space-x-2 text-xs transition-colors duration-300"
          >
            {/* Dynamic Status Icon */}
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full border transition-all ${
                password.length === 0
                  ? "border-slate-200 dark:border-slate-800 text-transparent"
                  : item.met
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-500"
              }`}
            >
              {item.met ? (
                <svg
                  className="w-2.5 h-2.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-2 h-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </span>

            {/* Checklist Label */}
            <span
              className={`transition-colors ${
                password.length === 0
                  ? "text-slate-400 dark:text-slate-500"
                  : item.met
                    ? "text-slate-700 dark:text-slate-300 font-medium"
                    : "text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-700"
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
