"use client";
import React, { useState } from "react";
import { Mic, CheckCircle, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function MockInterviewWidget() {
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const startInterview = async () => {
    if (!topic) return toast.error("Please enter a topic");
    setIsLoading(true);
    setFeedback("");
    setAnswer("");
    
    try {
      // For demonstration, we'll mock the Groq API call here since we're building the frontend widget.
      // In a real app, this calls `/api/ai/interview/question`
      await new Promise(r => setTimeout(r, 1000));
      setQuestion(`Can you explain a challenging concept related to ${topic} and how you would apply it in a real-world project?`);
    } catch (e) {
      toast.error("Failed to generate question");
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer) return toast.error("Please provide an answer");
    setIsLoading(true);

    try {
      // In a real app, this calls `/api/ai/interview/feedback`
      await new Promise(r => setTimeout(r, 1500));
      setFeedback("Great attempt! You clearly defined the concept. To improve, try using the STAR method (Situation, Task, Action, Result) to give a concrete example of how you applied this in a past project. This makes your answer much more compelling to interviewers.");
    } catch (e) {
      toast.error("Failed to generate feedback");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 mt-12 mb-12 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-violet-500/20 text-violet-400 rounded-xl">
          <Mic className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            AI Mock Interview Simulator <Sparkles className="w-5 h-5 text-yellow-500" />
          </h2>
          <p className="text-zinc-400 text-sm">Practice answering interview questions and receive instant Groq AI feedback.</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {!question ? (
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="e.g. Software Engineering, College Admissions"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-violet-500/50"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button 
              onClick={startInterview}
              disabled={isLoading || !topic}
              className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Interview"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
              <h4 className="text-sm font-bold text-violet-400 uppercase tracking-wider mb-2">Interview Question:</h4>
              <p className="text-lg">{question}</p>
            </div>

            {!feedback ? (
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-violet-500/50 resize-none"
                  placeholder="Type your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
                <div className="flex gap-4">
                  <button 
                    onClick={submitAnswer}
                    disabled={isLoading || !answer}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Answer"}
                  </button>
                  <button 
                    onClick={() => { setQuestion(""); setAnswer(""); }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-6 py-3 rounded-xl"
                  >
                    End Interview
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20">
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Actionable Feedback:
                </h4>
                <p className="text-zinc-300 leading-relaxed">{feedback}</p>
                <button 
                    onClick={() => { setQuestion(""); setAnswer(""); setFeedback(""); }}
                    className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl"
                  >
                    Try Another Topic
                  </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
