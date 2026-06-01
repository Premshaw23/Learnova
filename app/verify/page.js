"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebaseConfig";
import {
  sendEmailVerification,
  reload,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Mail,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  Shield,
  Clock,
} from "lucide-react";

export default function EmailVerificationPage() {
  const { user, userProfile, loading: authLoading } = useAuthContext();
  const [isSending, setIsSending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const getDashboardLink = (role) => {
    if (!role) return "/profile";
    switch (role) {
      case "student": return "/student/dashboard";
      case "teacher": return "/teacher/dashboard";
      case "institute": return "/institute/dashboard";
      case "admin": return "/admin/dashboard";
      default: return "/profile";
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        if (user.emailVerified) {
          router.push(getDashboardLink(userProfile?.role));
        }
      } else {
        router.push("/auth");
      }
    }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (!user || resendCooldown > 0) return;

    setIsSending(true);
    setMessage("");

    try {
      await sendEmailVerification(user);
      setMessage(
        "Verification email sent! Please check your inbox and spam folder.",
      );
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;

    setIsChecking(true);
    setMessage("");

    try {
      await reload(user);
      if (user.emailVerified) {
        // Force refresh of the token so the cookie is updated with emailVerified: true
        await user.getIdToken(true);
        setMessage("Email verified successfully! Redirecting...");
        setTimeout(() => {
          router.push(getDashboardLink(userProfile?.role));
        }, 2000);
      } else {
        setMessage(
          "Email not verified yet. Please check your inbox and click the verification link.",
        );
      }
    } catch (error) {
      setMessage("Failed to check verification status. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/auth");
    } catch (error) {
      // Silently handle sign out errors
    }
  };

  const handleBackToAuth = () => {
    router.push("/auth");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-white">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Navbar />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          {/* Back Button */}
          <button
            onClick={handleBackToAuth}
            className="mb-8 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </button>

          <div className="max-w-lg mx-auto">
            <div className="bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full mb-6">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Verify Your Email
                </h1>
                <p className="text-gray-300">
                  We've sent a verification link to{" "}
                  <span className="font-medium text-indigo-400">
                    {user?.email}
                  </span>
                </p>
              </div>

              {/* Status Message */}
              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${
                    message.includes("successfully") || message.includes("sent")
                      ? "bg-green-900/50 border-green-700/50 text-green-300"
                      : message.includes("Failed") ||
                          message.includes("not verified")
                        ? "bg-yellow-900/50 border-yellow-700/50 text-yellow-300"
                        : "bg-blue-900/50 border-blue-700/50 text-blue-300"
                  }`}
                >
                  <p className="text-sm">{message}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <Mail className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Check Your Email
                    </h3>
                    <p className="text-sm text-gray-300">
                      Click the verification link in the email we sent you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white mb-1">
                      Check Spam Folder
                    </h3>
                    <p className="text-sm text-gray-300">
                      If you don't see the email, check your spam or junk
                      folder.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-700/30 rounded-lg">
                  <Clock className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-white mb-1">Return Here</h3>
                    <p className="text-sm text-gray-300">
                      Come back to this page and click "I've Verified My Email".
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  onClick={handleCheckVerification}
                  disabled={isChecking}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      I've Verified My Email
                    </>
                  )}
                </button>

                <button
                  onClick={handleResendVerification}
                  disabled={isSending || resendCooldown > 0}
                  className="w-full bg-gray-700/50 border border-gray-600 text-gray-200 py-3 px-4 rounded-xl font-medium hover:bg-gray-600/50 focus:ring-4 focus:ring-gray-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock className="w-5 h-5" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Resend Verification Email
                    </>
                  )}
                </button>
              </div>

              {/* Alternative Actions */}
              <div className="mt-8 pt-6 border-t border-gray-700/50">
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-400">Wrong email address?</p>
                  <button
                    onClick={handleSignOut}
                    className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                  >
                    Sign out and use different email
                  </button>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 text-sm">
                Still having trouble?{" "}
                <button className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
