"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react";
import { ROLE_CONFIG, USER_ROLES } from "@/constants/userRoles";
import { getPasswordStrength } from "@/utils/passwordStrength";
import {
  validateRequired,
  validateEmail,
  validatePassword,
  validateName,
} from "@/utils/formValidation";

export default function AuthForm({
  isLogin,
  selectedRole,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  instituteName,
  setInstituteName,
  inviteCode,
  setInviteCode,
  errors,
  setErrors,
  isLoading,
  onSubmit,
  onGoogleLogin,
  onRoleChange,
  onToggleLogin,
  onForgotPassword,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const passwordStrength = useMemo(
    () => getPasswordStrength(password),
    [password]
  );

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateField = (field, value) => {
    let result = true;
    if (field === "fullName") {
      result = validateName(value, "Full Name");
    } else if (field === "instituteName") {
      result = validateRequired(value, "Institute Name");
    } else if (field === "inviteCode") {
      result = validateRequired(value, "Invite Code");
    } else if (field === "email") {
      result = validateEmail(value);
    } else if (field === "password") {
      result = isLogin ? validateRequired(value, "Password") : validatePassword(value);
    }

    if (result !== true) {
      setErrors((prev) => ({ ...prev, [field]: result }));
    } else {
      clearError(field);
    }
  };

  return (
    <div>
      {/* Selected Role Display */}
      {selectedRole && ROLE_CONFIG[selectedRole] && (
        <div className="mb-6">
          <button
            onClick={onRoleChange}
            className="inline-flex items-center gap-3 p-4 bg-card backdrop-blur-sm rounded-xl border border-border hover:border-indigo-500/50 transition-all duration-200"
          >
            {(() => {
              const config = ROLE_CONFIG[selectedRole];
              if (!config) return null;
              const IconComponent = config.icon;
              return (
                <>
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.color} p-2`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                    <div className="text-left">
                    <h4 className="font-semibold text-card-foreground">{config.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      Click to change role
                    </p>
                  </div>
                </>
              );
            })()}
          </button>
        </div>
      )}

      <div className="bg-card backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-8 min-h-[620px] flex flex-col justify-between transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground">
            {isLogin
              ? `Sign in to your ${
                  ROLE_CONFIG[selectedRole]?.title.toLowerCase() || "account"
                } account`
              : `Create your ${
                  ROLE_CONFIG[selectedRole]?.title.toLowerCase() || "account"
                } account`}
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-lg">
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFullName(value);

                    if (errors.fullName) {
                      validateField("fullName", value);
                    }
                  }}
                  onBlur={(e) => validateField("fullName", e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground ${
                    errors.fullName ? "border-red-500/50" : "border-border"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {selectedRole === USER_ROLES.INSTITUTE && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Institute Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your institute name"
                    value={instituteName}
                   onChange={(e) => {
                      const value = e.target.value;
                      setInstituteName(value);

                      if (errors.instituteName) {
                        validateField("instituteName", value);
                      }
                    }}
                    onBlur={(e) => validateField("instituteName", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground ${
                      errors.instituteName
                        ? "border-red-500/50"
                        : "border-border"
                    }`}
                  />
                  {errors.instituteName && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.instituteName}
                    </p>
                  )}
                </div>
              )}

              {(selectedRole === USER_ROLES.TEACHER || selectedRole === USER_ROLES.INSTITUTE) && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center justify-between">
                    <span>Invite Code</span>
                    <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-full border border-border">Required for elevated access</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your registration code"
                    value={inviteCode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInviteCode(value);
                      if (errors.inviteCode) {
                        validateField("inviteCode", value);
                      }
                    }}
                    onBlur={(e) => validateField("inviteCode", e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground ${
                      errors.inviteCode
                        ? "border-red-500/50"
                        : "border-border"
                    }`}
                  />
                  {errors.inviteCode && (
                    <p className="text-red-400 text-sm mt-1">
                      {errors.inviteCode}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);

                  if (errors.email) {
                    validateField("email", value);
                  }
                }}
                onBlur={(e) => validateField("email", e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground ${
                  errors.email ? "border-red-500/50" : "border-border"
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);

                  if (errors.password) {
                    validateField("password", value);
                  }
                }}
                onBlur={(e) => validateField("password", e.target.value)}
                className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-background text-foreground placeholder-muted-foreground ${
                  errors.password ? "border-red-500/50" : "border-border"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-muted-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
            {!isLogin && !errors.password && (
              <p className="text-gray-400 text-xs mt-1">
                Min 8 characters with upper, lower, number, and special character.
              </p>
            )}
            {!isLogin && (
              <div className="mt-3 space-y-1.5 text-xs bg-slate-950/20 p-3 rounded-lg border border-border/50">
                <p className="font-semibold text-slate-400 mb-1">Password Requirements:</p>
                <div className="flex items-center gap-2">
                  <span className={password.length >= 8 ? "text-green-400" : "text-gray-400"}>
                    {password.length >= 8 ? "✓" : "○"} 8+ characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={/[A-Z]/.test(password) ? "text-green-400" : "text-gray-400"}>
                    {/[A-Z]/.test(password) ? "✓" : "○"} At least one uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={/[a-z]/.test(password) ? "text-green-400" : "text-gray-400"}>
                    {/[a-z]/.test(password) ? "✓" : "○"} At least one lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={/\d/.test(password) ? "text-green-400" : "text-gray-400"}>
                    {/\d/.test(password) ? "✓" : "○"} At least one number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={/[^A-Za-z0-9]/.test(password) ? "text-green-400" : "text-gray-400"}>
                    {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} At least one special character
                  </span>
                </div>
              </div>
            )}
            {!isLogin && password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-medium">Password Strength:</span>
                  <span
                    data-testid="password-strength-label"
                    className={`font-semibold transition-colors duration-300 ${passwordStrength.textClass}`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-gray-700/30 rounded-full overflow-hidden">
                  {[0, 1, 2, 3].map((index) => {
                    const activeSegments = Math.min(passwordStrength.score + 1, 4);
                    const isFilled = index < activeSegments;
                    return (
                      <div
                        key={index}
                        data-testid={`password-strength-bar-${index}`}
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isFilled ? passwordStrength.barClass : "bg-gray-700/50"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {isLogin && (
            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="mt-4 w-full bg-muted border border-border text-foreground py-3 px-4 rounded-xl font-medium hover:bg-muted/80 focus:ring-4 focus:ring-gray-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={onToggleLogin}
              className="text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
