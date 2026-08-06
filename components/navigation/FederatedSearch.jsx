"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Video, MessageSquare, FileText, X, ArrowRight, Clock } from "lucide-react";

/**
 * FederatedSearch Component
 * 
 * A unified, elastic search bar that indexes all text content, attached PDFs, 
 * video transcripts, and community forum threads, allowing rapid retrieval.
 */
export default function FederatedSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState({ courses: [], transcripts: [], forums: [], documents: [] });
  const inputRef = useRef(null);

  // Global keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Mock ElasticSearch logic
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ courses: [], transcripts: [], forums: [], documents: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchTimer = setTimeout(() => {
      // Mock results simulating a federated search return
      setResults({
        courses: [
          { id: "c1", title: "Object-Oriented Programming: Polymorphism", snippet: "Understanding the basics of polymorphism in Java." }
        ],
        transcripts: [
          { id: "t1", title: "Video: Class Inheritance", snippet: "...which is a great example of <mark>polymorphism</mark> in action.", timestamp: "12:45" },
          { id: "t2", title: "Video: Interface Design", snippet: "...so we achieve <mark>polymorphism</mark> through interfaces.", timestamp: "04:12" }
        ],
        forums: [
          { id: "f1", title: "Help: When to use Polymorphism?", author: "Student123", snippet: "I'm struggling to understand when to apply <mark>polymorphism</mark> vs simple inheritance." }
        ],
        documents: [
          { id: "d1", title: "Chapter 4: Advanced OOP Patterns.pdf", snippet: "Page 42: <mark>Polymorphism</mark> allows methods to do different things based on the object." }
        ]
      });
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(searchTimer);
  }, [query]);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-500 px-4 py-2 rounded-lg transition-colors border border-gray-200 w-64 shadow-sm"
      >
        <Search size={18} />
        <span className="text-sm font-medium flex-1 text-left">Search anything...</span>
        <div className="flex gap-1">
          <kbd className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-sans">⌘</kbd>
          <kbd className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-sans">K</kbd>
        </div>
      </button>
    );
  }

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-24 p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[80vh]">
        
        {/* Search Input Area */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <Search size={24} className="text-blue-500 shrink-0" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, transcripts, forums, and PDFs..."
            className="w-full bg-transparent text-xl font-medium text-gray-800 outline-none placeholder-gray-400"
          />
          {isSearching && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></div>
          )}
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 p-1.5 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 flex-1">
          {!query && (
            <div className="text-center py-16 text-gray-400">
              <Search size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-medium text-gray-500">Type something to search across the entire platform</p>
            </div>
          )}

          {query && !isSearching && !hasResults && (
            <div className="text-center py-16 text-gray-500">
              <p>No results found for "<span className="font-bold text-gray-800">{query}</span>"</p>
            </div>
          )}

          {hasResults && (
            <div className="space-y-6">
              
              {/* Courses Results */}
              {results.courses.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><BookOpen size={14}/> Modules & Courses</h3>
                  <div className="space-y-2">
                    {results.courses.map(item => (
                      <div key={item.id} className="group p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer transition-all flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-800 group-hover:text-blue-700">{item.title}</p>
                          <p className="text-sm text-gray-500">{item.snippet}</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcripts Results */}
              {results.transcripts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Video size={14}/> Video Transcripts</h3>
                  <div className="space-y-2">
                    {results.transcripts.map(item => (
                      <div key={item.id} className="group p-3 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-800 group-hover:text-indigo-700">{item.title}</p>
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded flex items-center gap-1"><Clock size={12}/> {item.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 italic" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forum Results */}
              {results.forums.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare size={14}/> Community Forums</h3>
                  <div className="space-y-2">
                    {results.forums.map(item => (
                      <div key={item.id} className="group p-3 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100 cursor-pointer transition-all">
                        <p className="font-bold text-gray-800 group-hover:text-green-700">{item.title}</p>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Results */}
              {results.documents.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileText size={14}/> Documents & PDFs</h3>
                  <div className="space-y-2">
                    {results.documents.map(item => (
                      <div key={item.id} className="group p-3 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer transition-all">
                        <p className="font-bold text-gray-800 group-hover:text-red-700">{item.title}</p>
                        <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: item.snippet }}></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 p-3 text-xs text-gray-400 font-medium flex justify-between items-center">
          <span className="flex items-center gap-2">
            Use <kbd className="bg-white border border-gray-200 rounded px-1 text-gray-500 shadow-sm">↑</kbd> <kbd className="bg-white border border-gray-200 rounded px-1 text-gray-500 shadow-sm">↓</kbd> to navigate
          </span>
          <span className="flex items-center gap-2">
            <kbd className="bg-white border border-gray-200 rounded px-1 text-gray-500 shadow-sm">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
