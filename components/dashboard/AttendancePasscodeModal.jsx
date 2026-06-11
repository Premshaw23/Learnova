import React, { useEffect, useRef } from "react";
import { Key, Check, Copy } from "lucide-react";

export const AttendancePasscodeModal = ({
  showPasscodeModal,
  setShowPasscodeModal,
  currentPasscode,
  copyPasscode,
  copied,
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!showPasscodeModal) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowPasscodeModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [showPasscodeModal, setShowPasscodeModal]);
  if (!showPasscodeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-md w-full outline-none"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Attendance Passcode Generated
          </h3>
          <p className="text-gray-400">Share this code with your students</p>
        </div>

        <div className="bg-black/40 rounded-xl p-6 mb-6 text-center border border-white/10">
          <div className="text-sm text-gray-400 mb-2">Passcode</div>
          <div className="text-4xl font-mono text-white font-bold tracking-wider mb-4">
            {currentPasscode}
          </div>
          <button
            onClick={copyPasscode}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
           aria-label="Action button">
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowPasscodeModal(false)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
