"use client";

import { useEffect, useRef, useState } from "react";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import React from "react";
import toast from "react-hot-toast";
import { Upload, User, Mail, Hash, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import NextImage from "next/image";
import { validateRequired, validateName } from "@/utils/formValidation";
import { isValidEmail, suggestEmailCorrection } from "@/utils/emailValidation";
import * as faceapi from "face-api.js";
import { z } from "zod";
import { apiFetch } from "@/lib/apiClient";


// Strict validation schema matching issue #1567 criteria
const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long"),
  rollNo: z
    .string()
    .trim()
    .min(8, "Roll Number must be at least 8 characters long")
    .regex(/[A-Z]/, "Roll Number must contain at least one uppercase letter")
    .regex(/[0-9]/, "Roll Number must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Roll Number must contain at least one special character"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
});

export default function RegisterPage() {
  const MODEL_URL = "/models";
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models:", err);
      }
    };
    loadModels();
  }, []);
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
        const res = await apiFetch(`/api/images?id=${registeredUser._id}`, {
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
      } catch (err) {
        console.error("Face registration failed:", err);
        toast.error("Face registration failed. Please try again or use email signup.");
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

    const hasUppercase = /[A-Z]/.test(rollNo); // Or substitute with password variable if available
    const hasNumber = /[0-9]/.test(rollNo);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(rollNo);

    if (rollNo.length < 8 || !hasUppercase || !hasNumber || !hasSpecialChar) {
      const msg = "Validation failed: Must be 8+ characters with an uppercase letter, number, and special character.";
      setError(msg);
      toast.error(msg);
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

    let faceDescriptorString = "";
    if (photo) {
      if (!modelsLoaded) {
        setError("Face recognition models are loading. Please wait a moment and try again.");
        toast.error("Face models are still loading. Please wait.");
        setIsLoading(false);
        return;
      }

      const toastId = toast.loading("Analyzing profile photo for face detection...");
      try {
        const photoUrl = URL.createObjectURL(photo);
        const img = await faceapi.fetchImage(photoUrl);
        const detection = await faceapi
          .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        URL.revokeObjectURL(photoUrl);

        if (!detection) {
          setError("Could not detect a clear face in the uploaded photo. Please upload a clear headshot.");
          toast.error("Face detection failed. Please upload a clear headshot photo.", { id: toastId });
          setIsLoading(false);
          return;
        }

        faceDescriptorString = JSON.stringify(Array.from(detection.descriptor));
        toast.success("Face successfully detected and processed!", { id: toastId });
      } catch (err) {
        console.error("Face detection error:", err);
        setError("Error analyzing face image. Please ensure you uploaded a valid image file.");
        toast.error("Error analyzing face. Please try again.", { id: toastId });
        setIsLoading(false);
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("rollNo", rollNo);
    formData.append("email", email);
    if (photo) {
      formData.append("photo", photo);
    }
    if (faceDescriptorString) {
      formData.append("faceDescriptor", faceDescriptorString);
    }

    try {
      const token = await user?.getIdToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await apiFetch("/api/register", {
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
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px] dark:bg-indigo-500/8" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-violet-500/5 blur-[100px] dark:bg-violet-500/8" />

      <Navbar />

      <main className="relative z-10 flex items-start justify-center px-4 pb-16 pt-24">
        <div className="mt-8 w-full max-w-6xl flex flex-col lg:flex-row gap-8">

          {/* Form card */}
          <div className="flex-1 rounded-2xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
            {/* Card header */}
            <div className="border-b border-border px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-card-foreground">
                    Register New User
                  </h2>
                  <p className="text-sm text-muted-foreground">Join the Learnova community</p>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-8 py-6">
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                  </span>
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value.trimStart())}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:ring-indigo-400/30 dark:focus:border-indigo-400"
                  />
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <label htmlFor="rollNumber" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Hash className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                    Roll Number
                  </label>
                  <input
                    id="rollNumber"
                    type="text"
                    placeholder="Enter your roll number"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:ring-indigo-400/30 dark:focus:border-indigo-400"
                  />
                </div>

                {/* Email — read-only */}
                <div className="space-y-1.5">
                  <label htmlFor="emailAddress" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Mail className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                    Email Address
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                  />
                </div>

                {/* Profile Photo */}
                <div className="space-y-1.5">
                  <label htmlFor="profilePhoto" className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Upload className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    Profile Photo
                  </label>
                  <input
                    id="profilePhoto"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    required
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-indigo-500 file:to-violet-600 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:from-indigo-600 hover:file:to-violet-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:from-indigo-500 hover:to-violet-500 hover:shadow-lg hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Registering…
                    </>
                  ) : (
                    <>
                      <User className="w-4 h-4" />
                      Register Account
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Success card */}
          {registeredUser && (
            <div className="flex flex-1 flex-col items-center justify-start">
              <div className="w-full max-w-md rounded-2xl border border-emerald-500/20 bg-card shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
                {/* Success header */}
                <div className="border-b border-border bg-emerald-500/5 px-8 py-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-card-foreground">Registration Successful!</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Welcome to Learnova</p>
                </div>

                {/* Details */}
                <div className="px-8 py-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <User className="w-4 h-4 shrink-0 text-indigo-500 dark:text-indigo-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-semibold text-foreground">{registeredUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <Hash className="w-4 h-4 shrink-0 text-violet-500 dark:text-violet-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Roll No</p>
                      <p className="text-sm font-semibold text-foreground">{registeredUser.rollNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
                    <Mail className="w-4 h-4 shrink-0 text-pink-500 dark:text-pink-400" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-semibold text-foreground">{registeredUser.email}</p>
                    </div>
                  </div>

                  {registeredUser._id && registeredUserImageUrl && (
                    <div className="relative mt-2 h-64 w-full overflow-hidden rounded-xl border border-border">
                      <NextImage
                        src={registeredUserImageUrl}
                        alt={`${registeredUser.name}'s photo`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
