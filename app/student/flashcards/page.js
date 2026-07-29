"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Sparkles, Brain, PlusCircle, CheckCircle, ChevronRight, ChevronLeft, Loader2, Save } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function AIFlashcardsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleGenerate = async () => {
    if (inputText.length < 10) {
      setError("Please paste at least 10 characters of your notes.");
      return;
    }
    setError("");
    setIsGenerating(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate flashcards.");
      if (data.flashcards) {
        setCards(data.flashcards);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(c => c + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(c => c - 1);
      setIsFlipped(false);
    }
  };

  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      // Loop over cards and save each to the existing /api/flashcards route
      for (const card of cards) {
        await fetch("/api/flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ front: card.front, back: card.back, tags: ["AI Generated"] }),
        });
      }
      alert("Saved successfully to your library!");
    } catch (err) {
      console.error(err);
      alert("Error saving flashcards.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Input area */}
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Brain className="w-6 h-6 text-indigo-400" />
              AI Flashcard Generator
            </h2>
            <p className="text-sm text-zinc-400 mb-6">
              Paste your lecture notes, textbook summaries, or study material here. Our AI will automatically generate highly effective flashcards for active recall.
            </p>
            
            <textarea
              className="w-full h-64 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-200 focus:outline-none focus:border-indigo-500/50 resize-none mb-4"
              placeholder="Paste your notes here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? "Generating..." : "Generate Cards"}
            </button>
          </div>
        </div>

        {/* Right Side: Flashcard UI */}
        <div className="w-full lg:w-2/3 flex flex-col">
          {cards.length === 0 && !isGenerating ? (
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
              <PlusCircle className="w-16 h-16 text-zinc-700 mb-4" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">No Flashcards Yet</h3>
              <p className="text-zinc-600">Enter your notes and click Generate to see the magic happen.</p>
            </div>
          ) : isGenerating ? (
            <div className="flex-1 bg-zinc-900/30 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold text-indigo-400 mb-2">Analyzing your notes...</h3>
              <p className="text-zinc-500">Extracting key concepts for active recall.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="flex justify-between items-center w-full mb-6">
                <span className="text-zinc-400 font-medium">Card {currentIndex + 1} of {cards.length}</span>
                <button 
                  onClick={handleSaveToLibrary}
                  disabled={isSaving}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save to Library
                </button>
              </div>

              {/* Flashcard Component */}
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className="w-full max-w-lg aspect-[4/3] perspective-1000 cursor-pointer group"
              >
                <div className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  
                  {/* Front */}
                  <div className="absolute w-full h-full bg-zinc-900 border-2 border-indigo-500/30 rounded-3xl p-8 flex items-center justify-center backface-hidden shadow-2xl">
                    <div className="absolute top-4 left-4 flex items-center gap-2 text-indigo-400 font-bold text-sm">
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Question
                    </div>
                    <h3 className="text-2xl font-bold text-center leading-relaxed">
                      {cards[currentIndex].front}
                    </h3>
                  </div>

                  {/* Back */}
                  <div className="absolute w-full h-full bg-indigo-600 rounded-3xl p-8 flex items-center justify-center backface-hidden shadow-2xl rotate-y-180">
                    <div className="absolute top-4 left-4 flex items-center gap-2 text-indigo-200 font-bold text-sm">
                      <CheckCircle className="w-4 h-4" /> Answer
                    </div>
                    <p className="text-xl font-medium text-center text-white leading-relaxed">
                      {cards[currentIndex].back}
                    </p>
                  </div>
                  
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6 mt-8">
                <button
                  onClick={prevCard}
                  disabled={currentIndex === 0}
                  className="p-4 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <span className="text-zinc-500 text-sm">Click card to flip</span>
                <button
                  onClick={nextCard}
                  disabled={currentIndex === cards.length - 1}
                  className="p-4 rounded-full bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
      
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
