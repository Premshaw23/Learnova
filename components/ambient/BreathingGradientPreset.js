"use client";

import { motion } from "framer-motion";

export default function BreathingGradientPreset() {
  const breathingVariants = {
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const colorCycle = {
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      transition: {
        duration: 16,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Animated background gradient container */}
      <motion.div
        variants={colorCycle}
        animate="animate"
        className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-pink-600/40 opacity-60"
        style={{
          backgroundSize: "200% 200%",
        }}
      />

      {/* Breathing circles */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Outer breathing circle */}
        <motion.div
          variants={breathingVariants}
          animate="animate"
          className="absolute rounded-full border border-white/20 shadow-[0_0_60px_rgba(59,130,246,0.3)]"
          style={{
            width: "600px",
            height: "600px",
          }}
        />

        {/* Middle breathing circle */}
        <motion.div
          variants={breathingVariants}
          animate="animate"
          className="absolute rounded-full border border-white/30 shadow-[0_0_40px_rgba(147,51,234,0.25)]"
          style={{
            width: "400px",
            height: "400px",
            animationDelay: "-0.5s",
          }}
        />

        {/* Inner breathing circle */}
        <motion.div
          variants={breathingVariants}
          animate="animate"
          className="absolute rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 shadow-[inset_0_0_60px_rgba(59,130,246,0.2)]"
          style={{
            width: "200px",
            height: "200px",
          }}
        />

        {/* Center text */}
        <div className="absolute text-center z-10">
          <p className="text-white/60 text-lg font-light tracking-widest">
            BREATHE
          </p>
          <p className="text-white/40 text-sm mt-2">Find your rhythm</p>
        </div>
      </div>

      {/* Ambient glow corners */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
