"use client";

import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";

export default function StarrySkyPreset() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random stars
  const stars = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.6 + 0.4,
    }));
  }, [mounted]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Distant nebula effect */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(147,51,234,0.15),_transparent_40%),radial-gradient(circle_at_80%_70%,_rgba(59,130,246,0.15),_transparent_40%)]"
      />

      {/* Twinkling stars */}
      {mounted &&
        stars.map((star) => (
          <motion.div
            key={star.id}
            animate={{
              opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
            className="absolute rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
            }}
          />
        ))}

      {/* Shooting stars */}
      <div className="absolute inset-0">
        {[1, 2].map((i) => (
          <motion.div
            key={`shooting-${i}`}
            className="absolute w-0.5 h-0.5 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)]"
            animate={{
              x: ["-100%", "200vw"],
              y: ["-100%", "200vh"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 6,
              ease: "easeIn",
            }}
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Center message */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-white/50 text-lg font-light tracking-widest">
          STARRY SKY
        </p>
        <p className="text-white/30 text-sm mt-2">Infinite calm awaits</p>
      </div>

      {/* Ambient light glow */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
