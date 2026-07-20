"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { BrainCircuit, Sparkles, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 250, y: 150 }, data: { label: 'Enter notes below to generate map' }, type: 'input' },
];
const initialEdges = [];

export default function MindMapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return toast.error("Please enter some text or notes.");

    setIsGenerating(true);
    try {
      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText })
      });
      const data = await res.json();
      if (data.success && data.mindmapData) {
        setNodes(data.mindmapData.nodes || []);
        setEdges(data.mindmapData.edges || []);
        toast.success("Mind map generated!");
      } else {
        toast.error(data.error || "Failed to generate mind map");
      }
    } catch (error) {
      console.error("Failed to generate mind map", error);
      toast.error("An error occurred while analyzing notes.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-73px)]">
        
        {/* Sidebar for Input */}
        <div className="w-full md:w-1/3 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Mind Mapping</h1>
          </div>
          
          <p className="text-zinc-400 text-sm mb-6">
            Paste your notes, lecture transcript, or study material here. Our AI will automatically extract key concepts and map them out visually.
          </p>

          <form onSubmit={handleGenerate} className="flex-1 flex flex-col gap-4">
            <textarea
              className="flex-1 rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 resize-none"
              placeholder="E.g., The human nervous system consists of the Central Nervous System (CNS) and Peripheral Nervous System (PNS). The CNS includes the brain and spinal cord..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold transition-all"
            >
              {isGenerating ? (
                <><Sparkles className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><Send className="w-5 h-5" /> Generate Map</>
              )}
            </button>
          </form>
        </div>

        {/* Canvas Area */}
        <div className="w-full md:w-2/3 flex-1 relative bg-zinc-950">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-zinc-950"
            colorMode="dark"
          >
            <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
            <MiniMap nodeStrokeColor="#8b5cf6" nodeColor="#18181b" maskColor="rgba(0,0,0,0.7)" className="bg-zinc-900 border-zinc-800" />
            <Background color="#27272a" gap={16} />
            <Panel position="top-right" className="bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 backdrop-blur-md">
              Drag nodes to organize
            </Panel>
          </ReactFlow>
        </div>
        
      </div>
    </div>
  );
}
