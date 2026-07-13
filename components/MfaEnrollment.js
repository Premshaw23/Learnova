"use client";

import { useState, useEffect } from "react";
import { enrollTOTP, verifyTOTPEnrollment } from "@/services/authService";
import { Loader2, QrCode, ShieldCheck } from "lucide-react";

export default function MfaEnrollment({ user, onComplete, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState(null);
  const [qrUrl, setQrUrl] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    async function setup() {
      try {
        const result = await enrollTOTP(user);
        if (result.success) {
          setSecret(result.secret);
          // Use an external API to render the otpauth:// URI as a QR code image
          setQrUrl(
            `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              result.qrCodeUrl
            )}`
          );
        } else {
          setError(result.error || "Failed to initialize MFA enrollment.");
        }
      } catch (err) {
        setError("An unexpected error occurred during MFA setup.");
      } finally {
        setLoading(false);
      }
    }
    setup();
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    setVerifying(true);
    setError("");

    try {
      const result = await verifyTOTPEnrollment(user, secret, code);
      if (result.success) {
        onComplete();
      } else {
        setError(result.error || "Invalid code. Please try again.");
      }
    } catch (err) {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-300">Initializing secure setup...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl w-full animate-fadeIn">
      <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
        <ShieldCheck className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Secure Your Account</h2>
      <p className="text-slate-400 text-sm text-center mb-6">
        As an administrator, you are required to enable Multi-Factor Authentication (MFA). 
        Scan the QR code below using an authenticator app (like Google Authenticator or Authy).
      </p>

      {error && (
        <div className="w-full bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      {qrUrl ? (
        <div className="bg-white p-4 rounded-xl shadow-inner mb-6">
          <img src={qrUrl} alt="MFA QR Code" className="w-40 h-40 object-contain" />
        </div>
      ) : (
        <div className="w-40 h-40 bg-slate-800 rounded-xl mb-6 flex items-center justify-center border border-slate-700">
          <QrCode className="w-8 h-8 text-slate-500" />
        </div>
      )}

      <form onSubmit={handleVerify} className="w-full flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1 text-center">
            Enter 6-digit Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full text-center tracking-[0.5em] font-mono text-2xl p-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            autoFocus
          />
        </div>

        <div className="flex gap-3 mt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition font-semibold"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Enable"}
          </button>
        </div>
      </form>
    </div>
  );
}
