"use client";

import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Pen, Eraser, Undo, Redo, Download, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function WhiteboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const canvasRef = useRef(null);

  const [strokeColor, setStrokeColor] = useState("#a855f7"); // purple-500
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  const handleRedo = () => {
    canvasRef.current?.redo();
  };

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
  };

  const handleEraser = () => {
    setIsEraser(true);
    canvasRef.current?.eraseMode(true);
  };

  const handlePen = () => {
    setIsEraser(false);
    canvasRef.current?.eraseMode(false);
  };

  const handleDownload = () => {
    canvasRef.current?.exportImage("png")
      .then(data => {
        const link = document.createElement("a");
        link.href = data;
        link.download = "group-whiteboard.png";
        link.click();
      })
      .catch(e => {
        console.error(e);
      });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      
      {/* Toolbar */}
      <div className="h-16 border-b border-zinc-800 bg-zinc-900/80 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/student/pomodoro" className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold hidden sm:block">Group Whiteboard</h1>
        </div>

        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button 
            onClick={handlePen} 
            className={`p-2 rounded-lg transition-colors ${!isEraser ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
          >
            <Pen className="w-4 h-4" />
          </button>
          <button 
            onClick={handleEraser} 
            className={`p-2 rounded-lg transition-colors ${isEraser ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50'}`}
          >
            <Eraser className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>
          
          <input 
            type="color" 
            value={strokeColor} 
            onChange={(e) => { setStrokeColor(e.target.value); handlePen(); }}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
            title="Stroke Color"
          />
          <input 
            type="range" 
            min="1" max="20" 
            value={strokeWidth} 
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-24 mx-2 accent-indigo-500"
            title="Stroke Width"
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleUndo} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-zinc-800 mx-1"></div>
          <button onClick={handleClear} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Clear Canvas">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={handleDownload} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ml-2" title="Download">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-[#1e1e24] relative overflow-hidden">
        <ReactSketchCanvas
          ref={canvasRef}
          strokeWidth={strokeWidth}
          eraserWidth={strokeWidth * 2}
          strokeColor={strokeColor}
          canvasColor="transparent"
          className="absolute inset-0 w-full h-full border-none cursor-crosshair"
          style={{ border: 'none' }}
        />
        {/* Grid Background overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

    </div>
  );
}
