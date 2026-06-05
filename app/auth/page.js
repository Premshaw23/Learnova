"use client";

import { useState, useEffect, Suspense } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import { useRouter, useSearchParams } from "next/navigation";

import { Navbar } from "@/components/Navbar";
import RoleSelection from "@/components/RoleSelection";
import AuthForm from "@/components/AuthForm";
import HeroSection from "@/components/HeroSection";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import toast from "react-hot-toast";

import {
  loginWithEmail,
  signupWithEmail,
  loginWithGoogle,
  resetPassword,
} from "@/services/authService";

import { validateForm, redirectBasedOnRole } from "@/utils/authUtils";
import { USER_ROLES } from "@/constants/userRoles";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const [showRoleSelection, setShowRoleSelection] = useState(true);
  const [isLogin, setIsLogin] = useState(mode !== "signup");
  const [selectedRole, setSelectedRole] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
    setIsLogin(mode !== "signup");
  }, [mode]);

  useEffect(() => {
    if (analytics) logEvent(analytics, "page_view", { page: "auth" });
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowRoleSelection(false);
    setErrors({});
  };

  const handleRoleChange = () => {
    setShowRoleSelection(true);
    setErrors({});
  };

  const handleToggleLogin = () => {
    setIsLogin(!isLogin);
    setErrors({});
  };

  const handleSubmit = async (formData) => {
    // <-- Accept formData directly here
    const { email, password, fullName, instituteName, inviteCode } = formData; // Extract fields for the API call
    const { isValid, errors: validationErrors } = validateForm(
      formData,
      isLogin
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      let result;
      if (isLogin) {
        result = await loginWithEmail(email, password, selectedRole);
      } else {
        result = await signupWithEmail(email, password, selectedRole, {
          fullName,
          instituteName,
          inviteCode,
        });
      }

      if (result.needsVerification) {
        toast.success("Verification email sent! Please check your inbox.");
        setShowRoleSelection(true);
        router.push("/verify");
      } else if (result.needsProfile) {
        toast.success("Account created successfully!");
        setShowRoleSelection(true);
        router.push("/profile");
      } else if (result.success) {
        toast.success(
          isLogin ? "Successfully logged in!" : "Account created successfully!"
        );
        setShowRoleSelection(true);
        redirectBasedOnRole(result.userData.role, router);
      } else {
        setErrors({
          submit: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch {
      setErrors({
        submit:
          "Authentication failed. Please verify your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!selectedRole) {
      setErrors({ role: "Please select your role first" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Pass safe fallbacks since local text state is handled inside AuthForm now
      const result = await loginWithGoogle(selectedRole, isLogin, {
        fullName: "",
        instituteName: "",
      });
      if (result.success) {
        toast.success("Successfully logged in with Google!");
        redirectBasedOnRole(result.userData.role, router);
      } else {
        setErrors({
          submit:
            result.error ||
            "Google sign-in could not be completed. Please try again.",
        });
      }
    } catch {
      setErrors({
        submit: "An unexpected error occurred during Google authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (emailToReset) => {
    if (!emailToReset) {
      setErrors({ forgotEmail: "Please enter your email address" });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(emailToReset)) {
      setErrors({ forgotEmail: "Please enter a valid email address" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await resetPassword(emailToReset);
      if (result.success) {
        toast.success(
          "Password reset email sent! Check your inbox and spam folder."
        );
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
      } else {
        setErrors({ forgotEmail: result.error });
      }
    } catch {
      setErrors({
        forgotEmail:
          "Password reset failed. Please verify your email and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail(""); // changed from email to ""
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Page background accent */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/8" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px] dark:bg-violet-500/8" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        {showRoleSelection ? (
          /* ── Role selection ── */
          <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
            <div className="w-full animate-fadeIn">
              <RoleSelection onRoleSelect={handleRoleSelect} />
            </div>
          </div>
        ) : (
          /* ── Auth form + hero ── */
          <div className="grid min-h-[calc(100vh-10rem)] grid-cols-1 items-start gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
            {/* Left — form */}
            <div className="order-2 w-full animate-fadeIn lg:order-1">
              <ErrorBoundary>
                <div className="mx-auto w-full max-w-md">
                  <AuthForm
                    isLogin={isLogin}
                    selectedRole={selectedRole}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    onGoogleLogin={handleGoogleLogin}
                    onRoleChange={handleRoleChange}
                    onToggleLogin={handleToggleLogin}
                    onForgotPassword={handleOpenForgotPassword}
                  />
                </div>
              </ErrorBoundary>
            </div>

            {/* Right — hero */}
            <div className="order-1 w-full animate-fadeIn lg:order-2 lg:sticky lg:top-28">
              <div className="mx-auto w-full max-w-md lg:max-w-none">
                <HeroSection selectedRole={selectedRole} />
              </div>
            </div>
          </div>
        )}
      </div>

      <ForgotPasswordModal
        show={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setErrors({});
        }}
        onSubmit={handleForgotPassword}
        initialEmail={forgotPasswordEmail}
        error={errors.forgotEmail}
        isLoading={isLoading}
      />
    </div>
  );
}
