"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

const fieldBaseClasses =
  "w-full py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground";

const FieldShell = ({
  label,
  error,
  children,
}) => (
  <div>
    <label className="block text-sm font-medium text-foreground mb-2">
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
  </div>
);

export const TextInputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  icon: Icon,
  type = "text",
  autoComplete,
  maxLength,
}) => (
  <FieldShell label={label} error={error}>
    <div className="relative">
      {Icon ? (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      ) : null}
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur?.(event.target.value)}
        className={`${fieldBaseClasses} ${Icon ? "pl-10 pr-4" : "px-4"} ${error ? "border-red-500/50" : "border-border"}`}
      />
    </div>
  </FieldShell>
);

export const PasswordInputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  icon: Icon,
  autoComplete,
  maxLength,
  isVisible,
  onToggleVisibility,
  showRequirements = false,
  requirements,
  strength,
}) => (
  <FieldShell label={label} error={error}>
    <div className="relative">
      {Icon ? (
        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      ) : null}
      <input
        type={isVisible ? "text" : "password"}
        name={name}
        autoComplete={autoComplete}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur?.(event.target.value)}
        className={`${fieldBaseClasses} ${Icon ? "pl-10 pr-12" : "pl-4 pr-12"} ${error ? "border-red-500/50" : "border-border"}`}
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-muted-foreground"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>

    {showRequirements && requirements ? (
      <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Password strength
            </p>
            <p className={`text-sm font-medium ${strength?.textClass || "text-muted-foreground"}`}>
              {strength?.label || "Weak"}
            </p>
          </div>

          <div className="h-2 w-24 rounded-full bg-border overflow-hidden">
            <div className={`h-full ${strength?.barClass || "bg-red-500"} ${strength?.widthClass || "w-0"}`} />
          </div>
        </div>

        <ul className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <li className={requirements.lengthOk ? "text-emerald-400" : ""}>
            {requirements.lengthOk ? "✓" : "•"} At least 8 characters
          </li>
          <li className={requirements.hasUpper ? "text-emerald-400" : ""}>
            {requirements.hasUpper ? "✓" : "•"} One uppercase letter
          </li>
          <li className={requirements.hasLower ? "text-emerald-400" : ""}>
            {requirements.hasLower ? "✓" : "•"} One lowercase letter
          </li>
          <li className={requirements.hasNumber ? "text-emerald-400" : ""}>
            {requirements.hasNumber ? "✓" : "•"} One number
          </li>
          <li className={requirements.hasSpecial ? "text-emerald-400 sm:col-span-2" : "sm:col-span-2"}>
            {requirements.hasSpecial ? "✓" : "•"} One special character
          </li>
        </ul>
      </div>
    ) : null}
  </FieldShell>
);

export const OptionalInstituteField = (props) => {
  if (!props) {
    return null;
  }

  return <TextInputField {...props} />;
};

export const SelectedRoleBadge = ({ config, onClick }) => {
  if (!config) {
    return null;
  }

  const IconComponent = config.icon;

  return (
    <div className="mb-6">
      <button
        onClick={onClick}
        className="inline-flex items-center gap-3 p-4 bg-card backdrop-blur-sm rounded-xl border border-border hover:border-indigo-500/50 transition-all duration-200"
      >
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.color} p-2`}>
          <IconComponent className="w-6 h-6 text-white" />
        </div>

        <div className="text-left">
          <h4 className="font-semibold text-card-foreground">{config.title}</h4>
          <p className="text-muted-foreground text-sm">Click to change role</p>
        </div>
      </button>
    </div>
  );
};