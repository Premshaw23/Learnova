"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function ForgotPasswordModal({
  show,
  onClose,
  onSubmit,
  initialEmail = "",
  error = "",
  isLoading = false,
}) {
  const [email, setEmail] = useState(initialEmail);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email.trim());
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          show ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/5 overflow-hidden transition-all duration-300 transform ${
          show ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Ambient Glowing Spotlights */}
        <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-all duration-200 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-6 relative z-10">
          <h3 className="text-2xl font-extrabold text-white bg-clip-text bg-gradient-to-r from-white via-slate-200 to-purple-400 mb-2">
            Reset Password
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed max-w-sm mx-auto">
            Enter your email address below, and we'll send you a secure link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 text-white placeholder-slate-500 text-sm transition-all duration-300 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:flex-1 py-3 px-4 bg-slate-800 border border-white/5 text-slate-300 font-semibold text-sm rounded-xl hover:bg-slate-700/80 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
