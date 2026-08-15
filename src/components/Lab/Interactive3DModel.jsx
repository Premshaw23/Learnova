"use client";

import React, { useState, useEffect } from "react";
import { Box, RotateCw, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

export default function Interactive3DModel({ modelName = "Human Heart" }) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastPos.x;
    const deltaY = e.clientY - lastPos.y;
    
    setRotation(prev => ({
      x: prev.x + deltaY * 0.5,
      y: prev.y + deltaX * 0.5
    }));
    
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="w-full h-full flex flex-col rounded-xl overflow-hidden bg-black/40 border border-zinc-800 relative select-none">
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 border border-white/10 flex items-center gap-2">
        <Box size={14} />
        {modelName} (Interactive 3D)
      </div>

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-white/10">
          <ZoomIn size={16} />
        </button>
        <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-white/10">
          <ZoomOut size={16} />
        </button>
        <button onClick={() => { setZoom(1); setRotation({x:0, y:0}); }} className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg text-white transition-colors border border-white/10">
          <RotateCw size={16} />
        </button>
      </div>

      <div 
        className="flex-1 flex items-center justify-center cursor-move"
        onMouseDown={handleMouseDown}
      >
        {/* Mock 3D Object (CSS 3D Transform) */}
        <div 
          className="relative transition-transform duration-75 ease-out preserve-3d"
          style={{
            transform: `scale(${zoom}) rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg)`,
            transformStyle: 'preserve-3d',
            width: '200px',
            height: '200px'
          }}
        >
          {/* Mock Cube Faces */}
          <div className="absolute inset-0 bg-indigo-500/20 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'translateZ(100px)' }}>
            <Box size={48} className="text-indigo-400 opacity-50" />
          </div>
          <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'rotateY(180deg) translateZ(100px)' }}></div>
          <div className="absolute inset-0 bg-cyan-500/20 border-2 border-cyan-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'rotateY(90deg) translateZ(100px)' }}></div>
          <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'rotateY(-90deg) translateZ(100px)' }}></div>
          <div className="absolute inset-0 bg-fuchsia-500/20 border-2 border-fuchsia-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'rotateX(90deg) translateZ(100px)' }}></div>
          <div className="absolute inset-0 bg-rose-500/20 border-2 border-rose-500/50 rounded-2xl flex items-center justify-center backdrop-blur-sm" style={{ transform: 'rotateX(-90deg) translateZ(100px)' }}></div>
        </div>
      </div>
      
      <div className="absolute bottom-4 left-0 w-full flex justify-center pointer-events-none">
        <p className="text-xs text-zinc-500 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">Click and drag to rotate the model</p>
      </div>
    </div>
  );
}
