"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  X,
} from "lucide-react";

import { useAuthContext } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const categoryOptions = [
  { label: "Bug Report", value: "bug" },
  { label: "Feature Request", value: "feature" },
  { label: "UI Issue", value: "ui" },
  { label: "Other", value: "other" },
];

const initialFormState = {
  category: "bug",
  description: "",
};

export default function FeedbackWidget() {
  const { user, userProfile } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(initialFormState.category);
  const [description, setDescription] = useState(initialFormState.description);
  const [page, setPage] = useState("");
  const [userRole, setUserRole] = useState("user");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPage(window.location.pathname);
    }
  }, []);

  useEffect(() => {
    setUserRole(user?.role || userProfile?.role || "user");
  }, [user, userProfile]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    },
    []
  );

  if (!user) {
    return null;
  }

  const resetForm = () => {
    setCategory(initialFormState.category);
    setDescription(initialFormState.description);
    setError("");
  };

  const openWidget = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    resetForm();
    setSuccess(false);
    setIsOpen(true);
  };

  const closeWidget = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(false);
    setSuccess(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 20 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          category,
          description: trimmedDescription,
          page,
          userRole,
        }),
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || "Failed to submit feedback.");
      }

      setSuccess(true);
      resetForm();

      closeTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        closeTimerRef.current = null;
      }, 2000);
    } catch (submitError) {
      setError(submitError?.message || "Failed to submit feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(nextOpen) => (nextOpen ? openWidget() : closeWidget())}>
      <button
        type="button"
        onClick={openWidget}
        className="fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-purple-950/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
        aria-label="Open feedback widget"
      >
        <MessageSquarePlus size={20} />
        <span className="text-sm font-medium">Feedback</span>
      </button>

      <DialogContent className="max-w-lg">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-white shadow-2xl shadow-purple-950/30">
          <div className="pointer-events-none absolute -top-16 -left-16 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

          <button
            type="button"
            onClick={closeWidget}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close feedback widget"
          >
            <X className="h-4 w-4" />
          </button>

          <DialogHeader className="relative z-10 mb-6 text-left">
            <DialogTitle className="text-2xl font-bold text-white">
              Share feedback
            </DialogTitle>
            <DialogDescription className="mt-1 text-slate-400">
              Tell us what is working, what is not, and what you would like to see next.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="relative z-10 flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-purple-500/20 bg-white/5 px-6 py-10 text-center">
              <CheckCircle2 className="mb-4 h-12 w-12 text-purple-400" />
              <h3 className="text-xl font-semibold text-white">Thanks for your feedback!</h3>
              <p className="mt-2 text-sm text-slate-400">
                We have received your message and will review it shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Description
                  </label>
                  <span className={`text-xs ${description.trim().length < 20 ? "text-amber-300" : "text-slate-400"}`}>
                    {description.trim().length}/20 minimum
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setError("");
                  }}
                  rows={5}
                  minLength={20}
                  placeholder="Describe the issue, idea, or improvement in detail..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Minimum 20 characters required.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-400">
                <div className="flex items-center justify-between gap-4">
                  <span>Page</span>
                  <span className="truncate text-slate-300">{page || "/"}</span>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={closeWidget}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={description.trim().length < 20 || isSubmitting}
                  className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Submit feedback"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
