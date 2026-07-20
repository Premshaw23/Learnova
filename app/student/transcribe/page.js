"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Download, Copy, RefreshCw, AudioLines } from "lucide-react";
import toast from "react-hot-toast";
import { Navbar } from "@/components/Navbar";

export default function AudioTranscriptionPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguage] = useState("en-US");
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          let currentInterim = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error", event.error);
          if (event.error === 'not-allowed') {
            toast.error("Microphone access denied.");
            setIsRecording(false);
          }
        };

        recognition.onend = () => {
          if (isRecording) {
            // Auto-restart if still supposed to be recording
            try {
              recognition.start();
            } catch (e) {
              setIsRecording(false);
            }
          }
        };

        recognitionRef.current = recognition;
      } else {
        toast.error("Web Speech API is not supported in this browser. Please use Chrome or Edge.");
      }
    }
  }, [isRecording]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
      if (isRecording) {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 100);
      }
    }
  }, [language]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript("");
      toast("Recording paused.", { icon: "⏸️" });
    } else {
      setInterimTranscript("");
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success("Recording started!");
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClear = () => {
    if (confirm("Are you sure you want to clear the transcript?")) {
      setTranscript("");
      setInterimTranscript("");
    }
  };

  const handleCopy = () => {
    if (!transcript) return;
    navigator.clipboard.writeText(transcript);
    toast.success("Copied to clipboard!");
  };

  const handleDownload = () => {
    if (!transcript) return;
    const element = document.createElement("a");
    const file = new Blob([transcript], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "lecture_transcript.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Transcript downloaded!");
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <AudioLines className="w-4 h-4" />
            Live Transcription
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Audio-to-Text</h1>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Automatically transcribe your live lectures or conversations. The transcript is processed securely in your browser.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 h-[60vh] flex flex-col relative shadow-2xl">
              
              <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                {transcript === "" && interimTranscript === "" ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <Mic className="w-12 h-12 mb-4 opacity-50" />
                    <p>Click start to begin transcribing...</p>
                  </div>
                ) : (
                  <div className="text-lg leading-relaxed text-zinc-300">
                    {transcript}
                    <span className="text-zinc-500 italic ml-1">{interimTranscript}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <button
                  onClick={toggleRecording}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${
                    isRecording 
                      ? 'bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 shadow-red-500/10' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700 hover:border-zinc-600"
                    title="Copy Transcript"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all border border-zinc-700 hover:border-zinc-600"
                    title="Download Text File"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handleClear}
                    className="p-3 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-zinc-700 hover:border-red-500/50"
                    title="Clear Transcript"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="font-bold text-lg mb-4">Settings</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                  <option value="hi-IN">Hindi</option>
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                  Translation happens implicitly via the Speech API dictionary when speaking multiple languages depending on the OS support.
                </p>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6">
              <h3 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Pro Tip
              </h3>
              <p className="text-sm text-indigo-200/80">
                After transcribing your lecture, you can copy the text and paste it into the <strong>Study AI</strong> tool to generate concise notes and flashcards!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
