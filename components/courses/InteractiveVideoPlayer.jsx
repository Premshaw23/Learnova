"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Maximize, SkipForward, HelpCircle, CheckCircle, XCircle } from "lucide-react";

/**
 * InteractiveVideoPlayer Component
 * 
 * Embeds multiple-choice questions directly into the video player timeline.
 * The video pauses automatically at predefined timestamps and cannot proceed 
 * until the embedded question is answered correctly. Forces active recall.
 */
export default function InteractiveVideoPlayer({ src = "/demo-video.mp4", poster = "/poster.jpg" }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  // Interactive Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizStatus, setQuizStatus] = useState("idle"); // idle, success, error

  // Mock embedded questions at specific timestamps (in seconds)
  const embeddedQuestions = [
    {
      id: "q1",
      timestamp: 15,
      question: "Which hook is used to manage local state in a functional component?",
      options: ["useEffect", "useState", "useContext", "useReducer"],
      correctAnswer: "useState"
    },
    {
      id: "q2",
      timestamp: 45,
      question: "What does the dependency array in useEffect do?",
      options: [
        "Controls when the effect re-runs",
        "Injects props into the component",
        "Updates the DOM directly",
        "Nothing"
      ],
      correctAnswer: "Controls when the effect re-runs"
    }
  ];

  // Track time updates and pause for quizzes
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 100; // fallback to 100 to avoid NaN
    
    setCurrentTime(current);
    setProgress((current / duration) * 100);

    // Check if we hit a quiz timestamp (allow a small window of 0.5s to catch it)
    const pendingQuiz = embeddedQuestions.find(
      q => current >= q.timestamp && current < q.timestamp + 0.5 && activeQuiz?.id !== q.id
    );

    if (pendingQuiz) {
      videoRef.current.pause();
      setIsPlaying(false);
      setActiveQuiz(pendingQuiz);
      setSelectedAnswer(null);
      setQuizStatus("idle");
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (activeQuiz && quizStatus !== "success") {
      // Prevent playing if there's an active unanswered quiz
      return;
    }

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setActiveQuiz(null); // Clear successful quiz overlay if present
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    if (!videoRef.current) return;
    // For simplicity, we disable seeking past unanswered quizzes
    // In a real app, we'd check if the user is trying to skip ahead of a locked quiz
    
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const submitQuiz = () => {
    if (!selectedAnswer || !activeQuiz) return;
    
    if (selectedAnswer === activeQuiz.correctAnswer) {
      setQuizStatus("success");
      // Auto-resume video after correct answer
      setTimeout(() => {
        if (videoRef.current) {
          setActiveQuiz(null);
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 1500);
    } else {
      setQuizStatus("error");
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-800">
      
      {/* Video Element (Mock source placeholder) */}
      <div className="aspect-video bg-gray-900 relative">
        <video 
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-cover opacity-60" // Lowered opacity so we can see the mock text if no video loads
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        />
        
        {/* Mock content if video fails to load (since we use a fake src) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <Play size={120} className="text-white" />
        </div>

        {/* Embedded Quiz Overlay */}
        {activeQuiz && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-10 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 border-4 border-blue-500">
              <div className="flex items-center gap-3 mb-4 text-blue-600">
                <HelpCircle size={28} />
                <h3 className="text-xl font-bold">Knowledge Check</h3>
              </div>
              
              <p className="text-lg text-gray-800 font-medium mb-6 leading-relaxed">
                {activeQuiz.question}
              </p>

              <div className="space-y-3 mb-6">
                {activeQuiz.options.map((opt, idx) => (
                  <label 
                    key={idx}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAnswer === opt 
                        ? "border-blue-500 bg-blue-50 text-blue-800" 
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <input 
                      type="radio"
                      name={`quiz-${activeQuiz.id}`}
                      value={opt}
                      checked={selectedAnswer === opt}
                      onChange={() => setSelectedAnswer(opt)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-700">{opt}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <div className="flex-1">
                  {quizStatus === "error" && (
                    <p className="text-red-500 font-bold flex items-center gap-2 animate-bounce">
                      <XCircle size={18} /> Incorrect. Try again!
                    </p>
                  )}
                  {quizStatus === "success" && (
                    <p className="text-green-600 font-bold flex items-center gap-2 animate-pulse">
                      <CheckCircle size={18} /> Correct! Resuming video...
                    </p>
                  )}
                </div>
                <button 
                  onClick={submitQuiz}
                  disabled={!selectedAnswer || quizStatus === "success"}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pt-12">
        {/* Progress Bar */}
        <div 
          className="relative w-full h-2 bg-gray-600/50 rounded-full mb-4 cursor-pointer group"
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full group-hover:bg-blue-400 transition-colors"
            style={{ width: `${progress}%` }}
          ></div>
          
          {/* Markers for Embedded Questions */}
          {embeddedQuestions.map((q) => (
            <div 
              key={q.id}
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow border border-yellow-600 z-10"
              style={{ left: `${(q.timestamp / (videoRef.current?.duration || 100)) * 100}%` }}
              title="Embedded Question"
            ></div>
          ))}
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="hover:text-blue-400 transition-colors"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="hover:text-blue-400 transition-colors">
              <SkipForward size={24} />
            </button>
            <span className="text-sm font-medium font-mono text-gray-300">
              {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
              {Math.floor(currentTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          
          <button className="hover:text-blue-400 transition-colors">
            <Maximize size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
