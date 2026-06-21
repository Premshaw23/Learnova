"use client";

import { motion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";

export default function SoftFirefliesPreset() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate random fireflies
  const fireflies = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 5,
      pathX: (Math.random() - 0.5) * 80,
      pathY: (Math.random() - 0.5) * 80,
      glowColor: ["rgba(59,130,246,", "rgba(147,51,234,"][
        Math.floor(Math.random() * 2)
      ],
    }));
  }, [mounted]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Forest-like ambient gradient */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,_rgba(20,184,166,0.1),_transparent_50%),radial-gradient(circle_at_70%_60%,_rgba(59,130,246,0.1),_transparent_50%)]"
      />

      {/* Floating fireflies */}
      {mounted &&
        fireflies.map((fly) => (
          <motion.div
            key={fly.id}
            className="absolute rounded-full pointer-events-none"
            animate={{
              x: [0, fly.pathX, 0],
              y: [0, fly.pathY, 0],
              opacity: [0, 1, 0.5, 1, 0],
            }}
            transition={{
              duration: fly.duration,
              repeat: Infinity,
              delay: fly.delay,
              ease: "easeInOut",
            }}
            style={{
              left: `${fly.startX}%`,
              top: `${fly.startY}%`,
              width: `${fly.size}px`,
              height: `${fly.size}px`,
              boxShadow: `0 0 ${fly.size * 4}px ${fly.glowColor}0.8), 0 0 ${fly.size * 2}px ${fly.glowColor}0.4)`,
              backgroundColor: fly.glowColor + "0.6)",
            }}
          />
        ))}

      {/* Additional glow effect layer */}
      <div className="absolute inset-0 pointer-events-none">
        {mounted &&
          fireflies.slice(0, 15).map((fly) => (
            <motion.div
              key={`glow-${fly.id}`}
              className="absolute rounded-full pointer-events-none"
              animate={{
                x: [0, fly.pathX * 0.8, 0],
                y: [0, fly.pathY * 0.8, 0],
                opacity: [0, 0.3, 0, 0.3, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: fly.duration * 1.2,
                repeat: Infinity,
                delay: fly.delay,
                ease: "easeInOut",
              }}
              style={{
                left: `${fly.startX}%`,
                top: `${fly.startY}%`,
                width: `${fly.size * 3}px`,
                height: `${fly.size * 3}px`,
                backgroundColor: fly.glowColor + "0.2)",
                filter: "blur(8px)",
              }}
            />
          ))}
      </div>

      {/* Center message */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <p className="text-white/50 text-lg font-light tracking-widest">
          SOFT FIREFLIES
        </p>
        <p className="text-white/30 text-sm mt-2">Gentle glow surrounds you</p>
      </div>

      {/* Ambient light */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-800/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-800/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
