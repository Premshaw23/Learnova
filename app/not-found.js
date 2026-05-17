"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Home } from "lucide-react";
import DarkVeil from "@/components/ui-block/DarkVeil";
import { Navbar } from "@/components/Navbar";

const PARTICLES_DATA = [
  { id: 1, left: 16, top: 22, delay: 0, duration: 10 },
  { id: 2, left: 64, top: 78, delay: 1.5, duration: 12 },
  { id: 3, left: 82, top: 18, delay: 3, duration: 14 },
  { id: 4, left: 34, top: 66, delay: 4.5, duration: 11 },
  { id: 5, left: 90, top: 48, delay: 6, duration: 13 },
];

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setMousePosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    let mouseTimeout;
    const throttledMouseMove = (event) => {
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          handleMouseMove(event);
          mouseTimeout = null;
        }, 32);
      }
    };

    window.addEventListener("mousemove", throttledMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      if (mouseTimeout) clearTimeout(mouseTimeout);
    };
  }, [handleMouseMove]);

  const mouseOrbStyle = useMemo(
    () => ({
      left: mousePosition.x - 192,
      top: mousePosition.y - 192,
      transition: "all 1.2s ease-out",
    }),
    [mousePosition.x, mousePosition.y]
  );

  return (
    <>
      <Navbar />
      <div className="fixed inset-0 -z-10">
        <DarkVeil />
        <div
          className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl"
          style={mouseOrbStyle}
        />
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES_DATA.map((particle) => (
            <div
              key={particle.id}
              className="absolute h-1 w-1 rounded-full bg-accent/20 animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24 text-center text-white">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white">
            404
          </h1>
          <p className="text-lg sm:text-xl text-slate-300">
            The page you're looking for doesn't exist or may have moved. Check
            the URL or head back to the homepage.
          </p>
          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent to-purple-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition-all duration-500 hover:scale-[1.02]"
            >
              <Home className="h-4 w-4" />
              Go back home
            </Link>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-15px) rotate(90deg); opacity: 0.8; }
        }
        .animate-float { animation: float ease-in-out infinite; }
      `}</style>
    </>
  );
}