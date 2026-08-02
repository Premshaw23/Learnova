"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, User, Search, Clock } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function TeacherMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [activeContact, setActiveContact] = useState(1);
  const [inputText, setInputText] = useState("");

  const contacts = [
    { id: 1, name: "Sarah's Parent", lastMessage: "Thank you for the update!", unread: 0, time: "10:30 AM" },
    { id: 2, name: "John's Parent", lastMessage: "Can we schedule a meeting?", unread: 2, time: "Yesterday" },
    { id: 3, name: "Emma's Parent", lastMessage: "She finished the assignment.", unread: 0, time: "Mon" }
  ];

  const messages = {
    1: [
      { id: 101, text: "Hello! Just wanted to update you on Sarah's progress. She did great on the math quiz.", sender: "teacher", time: "10:00 AM" },
      { id: 102, text: "That is wonderful to hear! Thank you for the update!", sender: "parent", time: "10:30 AM" }
    ],
    2: [
      { id: 201, text: "Hi, John seems to be struggling with science.", sender: "parent", time: "09:00 AM" },
      { id: 202, text: "Can we schedule a meeting?", sender: "parent", time: "09:05 AM" }
    ],
    3: [
      { id: 301, text: "She finished the assignment.", sender: "parent", time: "Monday" }
    ]
  };

  const [currentMessages, setCurrentMessages] = useState(messages[1]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'teacher')) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    setCurrentMessages(messages[activeContact] || []);
  }, [activeContact]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      text: inputText,
      sender: "teacher",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setCurrentMessages([...currentMessages, newMsg]);
    setInputText("");
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex gap-6 h-[calc(100vh-73px)]">
        
        {/* Contacts Sidebar */}
        <div className="w-1/3 bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-800 bg-zinc-900/80">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-indigo-400" /> Messages
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search parents..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 text-zinc-200"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {contacts.map(contact => (
              <button
                key={contact.id}
                onClick={() => setActiveContact(contact.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all flex gap-4 items-center ${
                  activeContact === contact.id ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-zinc-800/50 border border-transparent'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center relative flex-shrink-0">
                  <User className="w-6 h-6 text-zinc-400" />
                  {contact.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold truncate pr-2">{contact.name}</h3>
                    <span className="text-xs text-zinc-500 flex-shrink-0 flex items-center gap-1">
                      {contact.time}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{contact.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="w-2/3 bg-zinc-900/30 border border-zinc-800 rounded-3xl flex flex-col overflow-hidden relative">
          
          {/* Header */}
          <div className="h-20 border-b border-zinc-800 bg-zinc-900/80 p-6 flex items-center gap-4 backdrop-blur-md absolute top-0 w-full z-10">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h3 className="font-bold">{contacts.find(c => c.id === activeContact)?.name}</h3>
              <p className="text-xs text-emerald-400 font-medium">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 pt-28 space-y-6">
            {currentMessages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'teacher' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                  msg.sender === 'teacher' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {msg.time}
                </span>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 bg-zinc-900/80 border-t border-zinc-800">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-zinc-200"
              />
              <button 
                type="submit"
                disabled={!inputText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-xl px-6 py-3 font-semibold flex items-center gap-2 transition-all"
              >
                Send <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
        
      </div>
    </div>
  );
}
