"use client";
import React, { useState } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function Eli5Button({ text, children }) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchExplanation = async () => {
    if (explanation) {
      setIsOpen(true);
      return;
    }
    
    setIsLoading(true);
    setIsOpen(true);
    
    try {
      const res = await fetch("/api/ai/eli5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      if (data.success) {
        setExplanation(data.data.explanation);
      } else {
        toast.error("Could not simplify text.");
        setIsOpen(false);
      }
    } catch (err) {
      toast.error("Network error.");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block group">
      {/* Target Content */}
      <span className="border-b-2 border-dotted border-indigo-500/50 hover:bg-indigo-500/10 transition-colors cursor-help rounded-sm relative inline-block">
        {children || text}
        
        {/* Hover Button Trigger */}
        <button
          onClick={fetchExplanation}
          className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white rounded-full p-1 shadow-lg hover:scale-110 border border-indigo-400"
          title="Explain Like I'm 5 (AI)"
        >
          <Sparkles className="w-3 h-3" />
        </button>
      </span>

      {/* Popover */}
      {isOpen && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-4 w-72 bg-zinc-900 border border-indigo-500/30 rounded-xl shadow-2xl p-4 text-sm font-sans">
          {/* Arrow */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-b border-r border-indigo-500/30 rotate-45"></div>
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <span className="font-bold text-indigo-400 flex items-center gap-1 text-xs uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> AI Simplified
            </span>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-zinc-300 relative z-10">
            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
              </div>
            ) : (
              <p className="leading-relaxed">{explanation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
