"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Settings, VolumeX, Volume2, Command } from "lucide-react";

/**
 * VoiceNavigator Component
 * 
 * Integrates the Web Speech API to allow users with motor disabilities
 * to navigate modules, play/pause videos, and interact with the platform
 * using localized voice commands.
 */
export default function VoiceNavigator() {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lastCommand, setLastCommand] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      
      // We only care if the user uses the wake word "learnova"
      if (transcript.includes("learnova")) {
        const command = transcript.replace("learnova", "").trim();
        setLastCommand(command);
        executeCommand(command);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if it was supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch(e) {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!supported) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setLastCommand("Listening...");
      } catch(e) {
        console.error(e);
      }
    }
  };

  const executeCommand = (command) => {
    // Map voice commands to CustomEvents or navigation actions
    const commandMap = {
      "next module": () => window.dispatchEvent(new CustomEvent("navigation:next")),
      "previous module": () => window.dispatchEvent(new CustomEvent("navigation:prev")),
      "play video": () => window.dispatchEvent(new CustomEvent("video:play")),
      "pause video": () => window.dispatchEvent(new CustomEvent("video:pause")),
      "submit quiz": () => window.dispatchEvent(new CustomEvent("quiz:submit")),
      "go to dashboard": () => window.location.href = "/dashboard"
    };

    // Try to find a matching command
    for (const [key, action] of Object.entries(commandMap)) {
      if (command.includes(key)) {
        action();
        
        // Provide audio feedback
        const msg = new SpeechSynthesisUtterance(`Executing: ${key}`);
        window.speechSynthesis.speak(msg);
        return;
      }
    }
    
    // Command not found
    setLastCommand(`Unknown command: "${command}"`);
  };

  if (!supported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Command Log & Helper Panel */}
      {isExpanded && (
        <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-2xl w-72 mb-2 border border-gray-700 transition-all origin-bottom-right">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
            <h3 className="font-bold flex items-center gap-2"><Command size={16} className="text-blue-400" /> Voice Assistant</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                {isListening && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isListening ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              </span>
              <span className="text-sm font-medium">{isListening ? "Listening for 'Learnova...'" : "Paused"}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Last Detected</p>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 h-12 flex items-center">
              <p className="text-sm italic text-gray-300 truncate w-full">
                {lastCommand || "Say 'Learnova, next module'"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Available Commands</p>
            <ul className="text-xs space-y-2 text-gray-300">
              <li className="flex items-center gap-2"><span className="text-blue-400 font-bold">"Learnova,"</span> play/pause video</li>
              <li className="flex items-center gap-2"><span className="text-blue-400 font-bold">"Learnova,"</span> next/previous module</li>
              <li className="flex items-center gap-2"><span className="text-blue-400 font-bold">"Learnova,"</span> submit quiz</li>
            </ul>
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-700 transition-colors border border-gray-600"
          title="Voice Assistant Settings"
        >
          <Settings size={20} />
        </button>
        
        <button 
          onClick={toggleListening}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all border-2 ${
            isListening 
              ? "bg-blue-600 border-blue-400 text-white hover:bg-blue-700" 
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
          title={isListening ? "Stop Voice Assistant" : "Start Voice Assistant"}
        >
          {isListening ? (
            <Mic size={24} className="animate-pulse" />
          ) : (
            <MicOff size={24} />
          )}
        </button>
      </div>
    </div>
  );
}
