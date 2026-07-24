"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Box, Layers, Dna, Rocket, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";

// We inject the script tags dynamically in the layout/page
export default function STEMModelsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeModel, setActiveModel] = useState({
    id: "dna",
    name: "DNA Double Helix",
    icon: Dna,
    src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb", // Using standard public model for demo
    description: "Explore the fundamental building blocks of life. Rotate to see the base pairs forming the double helix structure."
  });

  const models = [
    {
      id: "dna",
      name: "Astronaut (Demo)",
      icon: Dna,
      src: "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
      description: "Interactive 3D model of an astronaut. Use your mouse or touch to rotate, pan, and zoom."
    },
    {
      id: "rocket",
      name: "Spacecraft",
      icon: Rocket,
      src: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb", // Neil Armstrong suit
      description: "Detailed 3D scan of Neil Armstrong's spacesuit."
    }
  ];

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Load the model-viewer script if it's not already loaded
  useEffect(() => {
    if (!document.querySelector('script[src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"]')) {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)]">
        
        {/* Sidebar */}
        <div className="w-full md:w-1/4 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Box className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">STEM 3D Lab</h1>
          </div>

          <div className="space-y-3">
            {models.map(model => (
              <button
                key={model.id}
                onClick={() => setActiveModel(model)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                  activeModel.id === model.id
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <model.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{model.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3D Viewer Area */}
        <div className="w-full md:w-3/4 flex-1 relative bg-[#111] flex flex-col items-center justify-center p-8">
          <div className="absolute top-8 left-8 z-10 max-w-md pointer-events-none">
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
              {activeModel.name} <Sparkles className="w-5 h-5 text-yellow-500" />
            </h2>
            <p className="text-zinc-400">{activeModel.description}</p>
          </div>
          
          <div className="w-full h-full max-w-4xl max-h-[800px] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl relative">
            <model-viewer 
              src={activeModel.src} 
              auto-rotate 
              camera-controls 
              shadow-intensity="1"
              environment-image="neutral"
              style={{ width: '100%', height: '100%', backgroundColor: '#09090b' }}
            >
              <div slot="progress-bar" className="w-full h-1 bg-zinc-800 absolute top-0 left-0">
                <div className="h-full bg-blue-500 w-full animate-pulse origin-left" style={{ transform: 'scaleX(0.5)' }}></div>
              </div>
            </model-viewer>
          </div>
          
          <div className="absolute bottom-8 right-8 z-10 flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 backdrop-blur flex items-center gap-2">
              <Layers className="w-3 h-3" /> Drag to rotate • Scroll to zoom
            </span>
          </div>
        </div>
        
      </div>
    </div>
  );
}
