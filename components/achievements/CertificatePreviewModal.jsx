"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText } from "lucide-react";

export default function CertificatePreviewModal({ achievement, onClose }) {
  if (!achievement) return null;

  const isPdf = achievement.certificateUrl?.toLowerCase().includes(".pdf");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#0B1120]/95 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div>
              <h3 className="text-lg font-bold text-white">{achievement.title}</h3>
              <p className="text-sm text-gray-400">{achievement.category}</p>
            </div>
            <div className="flex items-center gap-2">
              {achievement.certificateUrl && (
                <a
                  href={achievement.certificateUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-auto max-h-[calc(90vh-80px)]">
            {achievement.certificateUrl ? (
              isPdf ? (
                <iframe
                  src={achievement.certificateUrl}
                  title={`Certificate: ${achievement.title}`}
                  className="w-full h-[60vh] rounded-xl border border-white/10"
                />
              ) : (
                <img
                  src={achievement.certificateUrl}
                  alt={`Certificate: ${achievement.title}`}
                  className="w-full max-h-[60vh] object-contain rounded-xl border border-white/10"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileText className="w-12 h-12 mb-3 opacity-50" />
                <p>No certificate file attached</p>
              </div>
            )}
            <p className="mt-4 text-sm text-gray-400">{achievement.description}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
