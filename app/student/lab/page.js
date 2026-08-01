"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Beaker, Zap, Play, RotateCcw, HelpCircle, Layers, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function PhysicsLabPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("circuit");
  
  // Circuit State
  const [circuitState, setCircuitState] = useState({
    switchClosed: false,
    hasWire: true,
    hasBattery: true,
    hasBulb: true,
  });

  // Gravity State
  const [gravity, setGravity] = useState(9.8); // m/s^2
  const [mass, setMass] = useState(5); // kg
  const [height, setHeight] = useState(10); // m
  const [ballY, setBallY] = useState(0); // Animation Y
  const [isFalling, setIsFalling] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Gravity Simulation loop
  useEffect(() => {
    if (isFalling) {
      const updatePhysics = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        
        // s = 0.5 * g * t^2
        const s = 0.5 * gravity * elapsed * elapsed;
        const v = gravity * elapsed;

        if (s >= height) {
          // Hit the ground
          setBallY(height);
          setVelocity(gravity * Math.sqrt(2 * height / gravity));
          setTimeElapsed(Math.sqrt(2 * height / gravity));
          setIsFalling(false);
        } else {
          setBallY(s);
          setVelocity(v);
          setTimeElapsed(elapsed);
          animationRef.current = requestAnimationFrame(updatePhysics);
        }
      };
      animationRef.current = requestAnimationFrame(updatePhysics);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isFalling, gravity, height]);

  const handleStartFall = () => {
    setBallY(0);
    setVelocity(0);
    setTimeElapsed(0);
    startTimeRef.current = null;
    setIsFalling(true);
  };

  const handleResetFall = () => {
    setIsFalling(false);
    setBallY(0);
    setVelocity(0);
    setTimeElapsed(0);
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        
        {/* Lab Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
              <Beaker className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">STEM Physics Lab</h1>
              <p className="text-sm text-zinc-400">Interactive physics simulations to visualize textbook theories.</p>
            </div>
          </div>
          
          <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("circuit")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "circuit" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" /> Circuit Lab
            </button>
            <button
              onClick={() => setActiveTab("gravity")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                activeTab === "gravity" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" /> Gravity Lab
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Simulation Viewport (Left 2 columns) */}
          <div className="lg:col-span-2 bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-6 relative flex flex-col justify-center min-h-[450px]">
            {activeTab === "circuit" ? (
              <div className="flex flex-col items-center justify-between h-full">
                <span className="absolute top-6 left-6 text-xs text-zinc-500 font-semibold tracking-wider uppercase">Interactive Circuit</span>
                
                {/* SVG Circuit Visualizer */}
                <svg className="w-full max-w-lg h-64 mt-8" viewBox="0 0 400 200">
                  {/* Wires */}
                  <path d="M 100,50 L 100,150 L 300,150 L 300,50 L 250,50" fill="none" stroke={circuitState.switchClosed ? "#fbbf24" : "#4b5563"} strokeWidth="4" />
                  <path d="M 100,50 L 150,50" fill="none" stroke={circuitState.switchClosed ? "#fbbf24" : "#4b5563"} strokeWidth="4" />

                  {/* Battery */}
                  <g transform="translate(75, 80)">
                    <rect x="0" y="0" width="50" height="30" rx="4" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <rect x="15" y="-6" width="20" height="6" fill="#ef4444" />
                    <text x="25" y="20" fill="#9ca3af" fontSize="12" textAnchor="middle" fontWeight="bold">9V</text>
                  </g>

                  {/* Bulb */}
                  <g transform="translate(275, 80)">
                    {/* Glow effect */}
                    {circuitState.switchClosed && (
                      <circle cx="25" cy="15" r="30" fill="url(#bulb-glow)" opacity="0.6" />
                    )}
                    <circle cx="25" cy="15" r="20" fill={circuitState.switchClosed ? "#fbbf24" : "#1f2937"} stroke="#374151" strokeWidth="2" />
                    <path d="M 15,15 Q 25,5 35,15" fill="none" stroke={circuitState.switchClosed ? "#ffffff" : "#9ca3af"} strokeWidth="2" />
                    <rect x="20" y="32" width="10" height="8" fill="#4b5563" />
                  </g>

                  {/* Switch */}
                  <g transform="translate(150, 35)">
                    <line x1="0" y1="15" x2="100" y2="15" stroke="#4b5563" strokeWidth="2" strokeDasharray="5,5" />
                    <circle cx="10" cy="15" r="5" fill="#ef4444" />
                    <circle cx="90" cy="15" r="5" fill="#ef4444" />
                    {/* The switch arm */}
                    <line 
                      x1="10" 
                      y1="15" 
                      x2="90" 
                      y2={circuitState.switchClosed ? "15" : "-15"} 
                      stroke="#f3f4f6" 
                      strokeWidth="4" 
                      className="transition-all duration-300"
                    />
                  </g>

                  {/* Definitions for glow */}
                  <defs>
                    <radialGradient id="bulb-glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                </svg>

                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setCircuitState(prev => ({ ...prev, switchClosed: !prev.switchClosed }))}
                    className="px-6 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl font-semibold text-sm transition-all"
                  >
                    Toggle Switch ({circuitState.switchClosed ? "Opened" : "Closed"})
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-between h-full">
                <span className="absolute top-6 left-6 text-xs text-zinc-500 font-semibold tracking-wider uppercase">Gravity drop tower</span>
                
                {/* Fall Chamber */}
                <div className="w-full max-w-md h-72 border-x-2 border-b-2 border-zinc-800 bg-zinc-950/40 rounded-b-3xl relative overflow-hidden flex items-end">
                  {/* Ball */}
                  <div 
                    className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-xs shadow-lg shadow-indigo-500/20 absolute left-1/2 -translate-x-1/2"
                    style={{
                      top: `${(ballY / height) * 230}px`, // Max height translation
                      width: `${10 + mass * 4}px`,
                      height: `${10 + mass * 4}px`,
                    }}
                  >
                    {mass}kg
                  </div>
                  
                  {/* Ruler indicators */}
                  <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-between text-[10px] text-zinc-600 font-mono py-2">
                    <span>10m</span>
                    <span>7.5m</span>
                    <span>5.0m</span>
                    <span>2.5m</span>
                    <span>0m</span>
                  </div>
                </div>

                {/* Physics telemetry */}
                <div className="w-full grid grid-cols-3 gap-4 mt-6 text-center">
                  <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Time</span>
                    <p className="text-xl font-mono font-bold text-indigo-400">{timeElapsed.toFixed(3)}s</p>
                  </div>
                  <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Velocity</span>
                    <p className="text-xl font-mono font-bold text-emerald-400">{velocity.toFixed(2)} m/s</p>
                  </div>
                  <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Distance</span>
                    <p className="text-xl font-mono font-bold text-amber-400">{ballY.toFixed(2)}m</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Panel (Right column) */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                Lab Controls
              </h2>
              <p className="text-xs text-zinc-500 mb-6">Modify constants and properties to observe behavior updates.</p>
              
              {activeTab === "circuit" ? (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">Light Bulb</h4>
                      <p className="text-[10px] text-zinc-500">Draws current to produce light.</p>
                    </div>
                    <CheckCircle className={`w-5 h-5 ${circuitState.switchClosed ? "text-emerald-400" : "text-zinc-600"}`} />
                  </div>
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">9V Battery</h4>
                      <p className="text-[10px] text-zinc-500">Provides voltage difference.</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800/60 rounded-2xl">
                    <h4 className="text-sm font-semibold mb-2">Circuit Diagnostics</h4>
                    <div className="text-xs space-y-1.5 font-mono text-zinc-400">
                      <div className="flex justify-between"><span>Current:</span> <span className={circuitState.switchClosed ? "text-emerald-400" : ""}>{circuitState.switchClosed ? "0.9 Amps" : "0.0 Amps"}</span></div>
                      <div className="flex justify-between"><span>Resistance:</span> <span>10 Ohms</span></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-300">Object Mass</span>
                      <span className="font-semibold text-indigo-400">{mass} kg</span>
                    </label>
                    <input 
                      type="range" min="1" max="10" 
                      value={mass} 
                      onChange={(e) => setMass(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>

                  <div>
                    <span className="block text-sm text-zinc-300 mb-2">Gravity Environment</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Moon", g: 1.62 },
                        { label: "Earth", g: 9.81 },
                        { label: "Jupiter", g: 24.79 }
                      ].map((env) => (
                        <button
                          key={env.label}
                          onClick={() => { setGravity(env.g); handleResetFall(); }}
                          className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                            gravity === env.g 
                              ? "bg-indigo-600/10 border-indigo-500/30 text-indigo-300"
                              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          {env.label} ({env.g}m/s²)
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {activeTab === "gravity" && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={handleStartFall}
                  disabled={isFalling}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4" /> Drop Object
                </button>
                <button
                  onClick={handleResetFall}
                  className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-all"
                >
                  <RotateCcw className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
