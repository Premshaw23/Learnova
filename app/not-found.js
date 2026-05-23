"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import DarkVeil from "@/components/ui-block/DarkVeil";

const PARTICLES_DATA = [
  { id: 1, left: 16, top: 22, delay: 0, duration: 10 },
  { id: 2, left: 64, top: 78, delay: 1.5, duration: 12 },
  { id: 3, left: 82, top: 18, delay: 3, duration: 14 },
  { id: 4, left: 34, top: 66, delay: 4.5, duration: 11 },
  { id: 5, left: 90, top: 48, delay: 6, duration: 13 },
];

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event) => {
    setMousePosition({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setMousePosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    let timeout;

    const throttledMouseMove = (event) => {
      if (!timeout) {
        timeout = setTimeout(() => {
          handleMouseMove(event);
          timeout = null;
        }, 32);
      }
    };

    window.addEventListener("mousemove", throttledMouseMove, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", throttledMouseMove);
      if (timeout) clearTimeout(timeout);
    };
  }, [handleMouseMove]);

  const mouseOrbStyle = useMemo(
    () => ({
      left: mousePosition.x - 192,
      top: mousePosition.y - 192,
      transition: "all 1.2s ease-out",
    }),
    [mousePosition]
  );

  return (
    <>
      <Navbar />

      <div className="fixed inset-0 -z-10">
        <DarkVeil />

        <div
          className="absolute h-96 w-96 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-3xl pointer-events-none"
          style={mouseOrbStyle}
        />

        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES_DATA.map((particle) => (
            <div
              key={particle.id}
              className="absolute h-1.5 w-1.5 rounded-full bg-indigo-500/30 animate-float"
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
        <div className="w-full max-w-2xl space-y-8">
          <div className="inline-flex rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1 text-sm text-red-400">
            Error 404
          </div>

          <h1 className="animate-pulse text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight">
            404
          </h1>

          <h2 className="text-3xl font-bold">
            Page Not Found
          </h2>

          <p className="text-lg text-slate-300">
            Oops! The page you're trying to access doesn't exist,
            may have been moved, or the URL might be incorrect.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-400 backdrop-blur-sm">
            Requested path:{" "}
            <span className="font-mono text-white">
              {pathname}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-purple-500 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-accent/25 transition-all duration-300 hover:scale-105"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-15px) rotate(90deg);
            opacity: 0.8;
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </>
  );
}