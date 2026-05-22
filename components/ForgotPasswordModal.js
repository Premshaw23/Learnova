"use client";
import { useState } from "react";

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

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold text-white mb-4">
          Reset Password
        </h3>
        <p className="text-gray-300 mb-4">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700/50 text-white placeholder-gray-400"
              required
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2 px-4 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
