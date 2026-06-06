"use client";

import { useMemo, useState } from "react";
import { Mail, Lock, Sparkles } from "lucide-react";
import { ROLE_CONFIG, USER_ROLES } from "@/constants/userRoles";
import { getPasswordStrength } from "@/utils/passwordStrength";
import {
  getPasswordRequirementFlags,
  validateAuthField,
} from "@/utils/authFormValidation";
import {
  OptionalInstituteField,
  PasswordInputField,
  SelectedRoleBadge,
  TextInputField,
} from "@/components/auth/AuthFormFields";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(password || ""),
    [password]
  );
  const passwordRequirements = useMemo(
    () => getPasswordRequirementFlags(password || ""),
    [password]
  );

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateField = (field, value) => {
    const result = validateAuthField(field, value, {
      isLogin,
      password,
      confirmPassword,
    });

    if (result !== true) {
      setErrors((prev) => ({ ...prev, [field]: result }));
    } else {
      clearError(field);
    }
  };

  const handleFieldChange = (field, setter) => (value) => {
    setter(value);

    if (errors[field]) {
      validateField(field, value);
    }

    if (field === "password" && !isLogin && confirmPassword) {
      const confirmResult = validateAuthField("confirmPassword", confirmPassword, {
        password: value,
      });

      if (confirmResult === true) {
        clearError("confirmPassword");
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: confirmResult }));
      }
    }
  };

  const handleFieldBlur = (field) => (value) => {
    validateField(field, value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!isLogin && password !== confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "Passwords do not match",
      }));
      return;
    }

    onSubmit(event);
  };

  const selectedRoleConfig = selectedRole ? ROLE_CONFIG[selectedRole] : null;

  return (
    <div>
      {/* Selected Role Display */}
      {selectedRoleConfig ? (
        <SelectedRoleBadge config={selectedRoleConfig} onClick={onRoleChange} />
      ) : null}

      <div className="bg-card backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-8 min-h-[620px] flex flex-col justify-between transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-muted-foreground">
            {isLogin
              ? `Sign in to your ${ROLE_CONFIG[selectedRole]?.title.toLowerCase() || "account"} account`
              : `Create your ${ROLE_CONFIG[selectedRole]?.title.toLowerCase() || "account"} account`}
          </p>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-lg">
            <p className="text-red-300 text-sm">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin ? (
            <>
              <TextInputField
                label="Full Name"
                name="fullName"
                value={fullName}
                onChange={handleFieldChange("fullName", setFullName)}
                onBlur={handleFieldBlur("fullName")}
                error={errors.fullName}
                placeholder="Enter your full name"
              />

              {selectedRole === USER_ROLES.INSTITUTE ? (
                <OptionalInstituteField
                  label="Institute Name"
                  name="instituteName"
                  value={instituteName}
                  onChange={handleFieldChange("instituteName", setInstituteName)}
                  onBlur={handleFieldBlur("instituteName")}
                  error={errors.instituteName}
                  placeholder="Enter your institute name"
                />
              ) : null}
            </>
          ) : null}

          <TextInputField
            label="Email Address"
            name="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={handleFieldChange("email", setEmail)}
            onBlur={handleFieldBlur("email")}
            error={errors.email}
            placeholder="Enter your email"
            icon={Mail}
          />

          <PasswordInputField
            label="Password"
            name="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            maxLength={254}
            value={password}
            onChange={handleFieldChange("password", setPassword)}
            onBlur={handleFieldBlur("password")}
            error={errors.password}
            placeholder="Enter your password"
            icon={Lock}
            isVisible={showPassword}
            onToggleVisibility={() => setShowPassword((prev) => !prev)}
            showRequirements={!isLogin}
            requirements={passwordRequirements}
            strength={passwordStrength}
          />

          {!isLogin ? (
            <PasswordInputField
              label="Confirm Password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleFieldChange("confirmPassword", setConfirmPassword)}
              onBlur={handleFieldBlur("confirmPassword")}
              error={errors.confirmPassword}
              placeholder="Confirm your password"
              icon={Lock}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
            />
          ) : null}

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
            aria-busy={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-95 flex items-center justify-center gap-2"
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
              <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="mt-4 w-full bg-muted border border-border text-foreground py-3 px-4 rounded-xl font-medium hover:bg-muted/80 focus:ring-4 focus:ring-gray-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {isLoading ? "Please wait..." : "Continue with Google"}
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
