"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import AmbientModeFullscreen from "./AmbientModeFullscreen";

export default function AmbientMode() {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  return (
    <>
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-[#0f172a] dark:border-slate-700 shadow-2xl shadow-slate-950/40 backdrop-blur-xl p-6 lg:p-8">
        <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-inner shadow-slate-950/10 backdrop-blur-2xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.15),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_28%)]" />
          <div className="relative flex flex-col gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-300">
                Ambient Mode
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Calm Focus Space
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Sink into a serene gradient environment with soft motion to
              support mindful concentration and restorative breathing.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Soft glow edges create a calm visual field.",
                "Smooth ambient motion helps your eyes relax.",
              ].map((message) => (
                <motion.div
                  key={message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200"
                >
                  {message}
                </motion.div>
              ))}
            </div>

            <div className="relative h-48 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60">
              <motion.div
                animate={{ x: [0, -24, 0] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(129,140,248,0.4),_transparent_16%),radial-gradient(circle_at_80%_30%,_rgba(56,189,248,0.35),_transparent_15%),radial-gradient(circle_at_50%_80%,_rgba(129,140,248,0.28),_transparent_18%)]"
              />
            </div>

            <motion.button
              onClick={() => setIsFullscreenOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl self-start"
            >
              Enter Fullscreen Ambient Space
            </motion.button>
          </div>
        </div>
      </section>

      <AmbientModeFullscreen
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
      />
    </>
  );
}
