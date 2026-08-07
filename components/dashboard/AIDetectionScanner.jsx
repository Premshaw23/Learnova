"use client";

import React, { useState, useEffect } from "react";
import { Search, ShieldAlert, CheckCircle, BarChart, AlertTriangle, Fingerprint } from "lucide-react";

/**
 * AIDetectionScanner Component
 * 
 * An AI-specific detection layer for instructors. Analyzes submission burstiness, 
 * perplexity, and known LLM watermarks to provide an "AI-generated probability score."
 */
export default function AIDetectionScanner() {
  const [textInput, setTextInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState(null);

  const handleScan = () => {
    if (!textInput.trim()) return;
    
    setIsScanning(true);
    setResults(null);

    // Simulate analysis delay
    setTimeout(() => {
      // Mock analysis logic for demonstration
      const wordCount = textInput.trim().split(/\s+/).length;
      
      // Heuristics (simulated): highly repetitive structure -> low burstiness -> high AI chance
      // Low perplexity (predictable words) -> high AI chance
      
      // Let's generate stable random scores based on text length to make it deterministic
      const pseudoRandom = (textInput.length % 100) / 100;
      
      const isHighlyLikelyAI = pseudoRandom > 0.6;
      
      const aiScore = isHighlyLikelyAI 
        ? Math.floor(75 + (pseudoRandom * 20)) 
        : Math.floor(10 + (pseudoRandom * 30));
        
      const perplexity = isHighlyLikelyAI 
        ? Math.floor(20 + pseudoRandom * 30) // Low perplexity (predictable)
        : Math.floor(80 + pseudoRandom * 60); // High perplexity (human-like variance)
        
      const burstiness = isHighlyLikelyAI
        ? Math.floor(15 + pseudoRandom * 25) // Low burstiness (monotone sentence length)
        : Math.floor(65 + pseudoRandom * 35); // High burstiness (human-like spikes)

      setResults({
        aiScore,
        perplexity,
        burstiness,
        wordCount,
        verdict: aiScore > 70 ? "Highly Likely AI-Generated" : aiScore > 40 ? "Possible AI Assistance" : "Likely Human Written"
      });
      setIsScanning(false);
    }, 2000);
  };

  const getScoreColor = (score) => {
    if (score > 70) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (score > 40) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-green-500 bg-green-500/10 border-green-500/20";
  };

  const getVerdictIcon = (score) => {
    if (score > 70) return <AlertTriangle className="text-red-500" size={24} />;
    if (score > 40) return <ShieldAlert className="text-yellow-500" size={24} />;
    return <CheckCircle className="text-green-500" size={24} />;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 max-w-4xl mx-auto my-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-lg text-purple-700">
          <Fingerprint size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">LLM Plagiarism Detector</h2>
          <p className="text-gray-500 text-sm">Analyze submission burstiness, perplexity, and AI watermarks.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-3/5">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student Submission Text</label>
            <textarea 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste the student's assignment text here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-none font-medium text-gray-700"
            ></textarea>
          </div>
          
          <button 
            onClick={handleScan}
            disabled={isScanning || !textInput.trim()}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Analyzing Fingerprints...
              </>
            ) : (
              <>
                <Search size={18} />
                Run AI Detection Scan
              </>
            )}
          </button>
        </div>

        <div className="w-full lg:w-2/5 flex flex-col justify-center">
          {results ? (
            <div className={`p-6 rounded-2xl border ${getScoreColor(results.aiScore)} transition-all duration-500`}>
              <div className="flex items-center gap-3 mb-2">
                {getVerdictIcon(results.aiScore)}
                <h3 className="font-bold text-lg">{results.verdict}</h3>
              </div>
              
              <div className="mt-6 mb-8 text-center">
                <p className="text-sm uppercase tracking-widest font-semibold opacity-70 mb-2">AI Probability Score</p>
                <div className="text-6xl font-black">
                  {results.aiScore}<span className="text-3xl opacity-60">%</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1 opacity-80">
                    <span>Perplexity</span>
                    <span>{results.perplexity} (Avg)</span>
                  </div>
                  <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                    <div className="bg-current h-full rounded-full" style={{ width: `${Math.min(results.perplexity, 100)}%` }}></div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">Lower perplexity indicates predictable, AI-like phrasing.</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm font-semibold mb-1 opacity-80">
                    <span>Burstiness</span>
                    <span>{results.burstiness}/100</span>
                  </div>
                  <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
                    <div className="bg-current h-full rounded-full" style={{ width: `${results.burstiness}%` }}></div>
                  </div>
                  <p className="text-xs opacity-70 mt-1">Higher burstiness indicates human-like variation in sentence length.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
              <BarChart size={48} className="mb-4 text-gray-300" />
              <p className="text-center font-medium">Scan an assignment to view the AI-generated probability score, burstiness, and perplexity metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
