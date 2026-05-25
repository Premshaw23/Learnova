"use client";

import { useEffect, useRef, useState } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import React from "react";
import toast from "react-hot-toast";
import { Upload, User, Mail, Hash, Sparkles, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import NextImage from "next/image";
import { validateRequired, validateName } from "@/utils/formValidation";
import { isValidEmail, suggestEmailCorrection } from "@/utils/emailValidation";
export default function RegisterPage() {
  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "register" });
    }
  }, []);
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [email, setEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [registeredUserImageUrl, setRegisteredUserImageUrl] = useState(null);
  const [error, setError] = useState(null);
  const [emailSuggestion, setEmailSuggestion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ CORRECT LOCATION: Prefill email from auth user using useEffect
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (!registeredUser?._id) return;

    let cancelled = false;
    let url = null;

    const loadImage = async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch(`/api/images?id=${registeredUser._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok || cancelled) return;

        const blob = await res.blob();
        url = URL.createObjectURL(blob);
        if (!cancelled) {
          setRegisteredUserImageUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch {
        // silently fail
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [registeredUser, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setRegisteredUser(null);

    // Validate using centralized form validators
    const nameValidation = validateName(name, "Full Name");
    if (nameValidation !== true) {
      setError(nameValidation);
      return;
    }

    const rollNoValidation = validateRequired(rollNo, "Roll Number");
    if (rollNoValidation !== true) {
      setError(rollNoValidation);
      return;
    }
    if (!isValidEmail(email)) {
  const suggestion = suggestEmailCorrection(email);
  const message = suggestion
    ? `Invalid email. Did you mean ${suggestion}?`
    : "Please enter a valid email address.";

  setEmailSuggestion(suggestion || null);
  setError(message);
  toast.error(message);

  return;
}
setEmailSuggestion(null);

    const photoValidation = validateRequired(photo, "Profile Photo");
    if (photoValidation !== true) {
      setError(photoValidation);
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("rollNo", rollNo);
    formData.append("email", email);
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      const token = await user?.getIdToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // ✅ Check for HTTP success status first
        setRegisteredUser(data.data?.user ?? null);
        setName("");
        setRollNo("");
        setEmail(user?.email || ""); // ✅ Reset email to auth user's email
        setPhoto(null);
        toast.success("Registration successful!");
      } else {
        setError(data.error || "An unknown error occurred."); // ✅ Provide a default error message
        toast.error(data.error || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(156, 146, 172, 0.15) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      ></div>

      {/* Floating sparkles */}
      <div className="absolute top-20 left-10 text-purple-400/30 animate-pulse">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="absolute top-40 right-20 text-blue-400/30 animate-pulse delay-1000">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="absolute bottom-40 left-20 text-pink-400/30 animate-pulse delay-2000">
        <Sparkles className="w-5 h-5" />
      </div>

      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-6xl mt-12 flex flex-col lg:flex-row gap-8">
          <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] pointer-events-none"></div>

            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                  Register New User
                </h2>
                <p className="text-slate-300 text-lg">
                  Join the Learnova community
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="fullName" className="flex items-center gap-2 text-slate-200 font-medium">
                    <User className="w-4 h-4 text-purple-400" />
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="rollNumber" className="flex items-center gap-2 text-slate-200 font-medium">
                    <Hash className="w-4 h-4 text-blue-400" />
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    type="text"
                    placeholder="Enter your roll number"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
                  />
                </div>

                {/* Email (auto from auth, read-only) */}
                <div className="space-y-2">
                  <label htmlFor="emailAddress" className="flex items-center gap-2 text-slate-200 font-medium">
                    <Mail className="w-4 h-4 text-pink-400" />
                    Email Address
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={email}
                    readOnly // ✅ user cannot change
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="profilePhoto" className="flex items-center gap-2 text-slate-200 font-medium">
                    <Upload className="w-4 h-4 text-green-400" />
                    Profile Photo
                  </label>
                  <div className="relative">
                    <input
                      id="profilePhoto"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                      required
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white file:font-medium hover:file:from-purple-600 hover:file:to-pink-600 transition-all duration-300 backdrop-blur-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Registering...
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        Register Account
                      </>
                    )}
                  </span>
                </button>
              </form>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center font-medium backdrop-blur-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          {registeredUser && (
            <div className="flex-1 flex flex-col items-center justify-start">
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl w-full max-w-md relative overflow-hidden">
                {/* Success shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent -translate-x-full animate-[shimmer_2s_ease-in-out_infinite] pointer-events-none"></div>

                <div className="relative z-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                    Registration Successful!
                  </h3>
                  <p className="text-slate-300 mb-6">Welcome to Learnova</p>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="space-y-4 text-left">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-purple-400" />
                        <span className="text-slate-300">
                          <span className="font-medium text-white">Name:</span>{" "}
                          {registeredUser.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300">
                          <span className="font-medium text-white">
                            Roll No:
                          </span>{" "}
                          {registeredUser.rollNo}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-pink-400" />
                        <span className="text-slate-300">
                          <span className="font-medium text-white">Email:</span>{" "}
                          {registeredUser.email}
                        </span>
                      </div>
                    </div>

                    {registeredUser._id && registeredUserImageUrl && (
                      <div className="mt-6">
                        <img
                          src={registeredUserImageUrl}
                          alt={`${registeredUser.name}'s photo`}
                          className="w-full h-auto rounded-xl shadow-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
