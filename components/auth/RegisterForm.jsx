"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations/auth";
import { User, Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

/**
 * RegisterForm Component
 * Fully functional, highly interactive student/user sign-up component
 * powered by React Hook Form & Zod validations.
 */
export default function RegisterForm({ onSubmitSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordVal = watch("password", "");

  const handleFormSubmit = async (data) => {
    try {
      // Simulate API delay for premium UI representation
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Account created successfully!");
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 rounded-3xl border border-white/10 bg-zinc-950/40 backdrop-blur-md shadow-2xl space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-2">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Create Account
        </h2>
        <p className="text-slate-300 text-sm">
          Sign up with your credentials to get started
        </p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-200">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="John Doe"
              {...register("name")}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-zinc-900/60 text-white placeholder-slate-500 outline-none ${
                errors.name ? "border-red-500/50" : "border-white/10"
              }`}
            />
          </div>
          {errors.name && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-200">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type="email"
              placeholder="john@example.com"
              {...register("email")}
              className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-zinc-900/60 text-white placeholder-slate-500 outline-none ${
                errors.email ? "border-red-500/50" : "border-white/10"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-200">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-zinc-900/60 text-white placeholder-slate-500 outline-none ${
                errors.password ? "border-red-500/50" : "border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              {showPassword ? <Eye className="w-4 h-4" />: <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password.message}
            </p>
          )}

          {/* Real-time Checklist for UX/UI micro-interaction */}
          {passwordVal && (
            <div className="mt-2.5 p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                {passwordVal.length >= 8 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={passwordVal.length >= 8 ? "text-green-400 font-semibold" : "text-slate-400"}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/[A-Z]/.test(passwordVal) && /[a-z]/.test(passwordVal) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={(/[A-Z]/.test(passwordVal) && /[a-z]/.test(passwordVal)) ? "text-green-400 font-semibold" : "text-slate-400"}>
                  Uppercase & lowercase letters
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/[0-9]/.test(passwordVal) && /[^A-Za-z0-9]/.test(passwordVal) ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={(/[0-9]/.test(passwordVal) && /[^A-Za-z0-9]/.test(passwordVal)) ? "text-green-400 font-semibold" : "text-slate-400"}>
                  Numbers & special symbols
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-200">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("confirmPassword")}
              className={`w-full pl-10 pr-10 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-zinc-900/60 text-white placeholder-slate-500 outline-none ${
                errors.confirmPassword ? "border-red-500/50" : "border-white/10"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200"
              aria-label={showConfirmPassword ? "Show password" : "Hide password"}
            >
              {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs mt-1 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 mt-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed select-none flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            </>
          ) : (
            <span>Create Account</span>
          )}
        </motion.button>
      </form>
    </div>
  );
}