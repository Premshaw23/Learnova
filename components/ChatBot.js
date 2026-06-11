"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Moon,
  Sun,
  RefreshCw,
  BookOpen,
  Shield,
  BarChart3,
  Zap,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { useAuthContext } from "@/contexts/AuthContext";

export default function ChatBot() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthContext();
  const t = useTranslations("ChatBot");

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");

  const messagesEndRef = useRef(null);

  const categories = [
    { id: "general", label: t("categories.general"), icon: BookOpen },
    { id: "attendance", label: t("categories.attendance"), icon: Clock },
    { id: "activities", label: t("categories.activities"), icon: Zap },
    { id: "security", label: t("categories.security"), icon: Shield },
    { id: "analytics", label: t("categories.analytics"), icon: BarChart3 },
  ];

  const suggestedQuestions = {
    general: [
      t("suggestedQuestions.general.q1"),
      t("suggestedQuestions.general.q2"),
      t("suggestedQuestions.general.q3"),
      t("suggestedQuestions.general.q4"),
    ],
    attendance: [
      t("suggestedQuestions.attendance.q1"),
      t("suggestedQuestions.attendance.q2"),
      t("suggestedQuestions.attendance.q3"),
      t("suggestedQuestions.attendance.q4"),
    ],
    activities: [
      t("suggestedQuestions.activities.q1"),
      t("suggestedQuestions.activities.q2"),
      t("suggestedQuestions.activities.q3"),
      t("suggestedQuestions.activities.q4"),
    ],
    security: [
      t("suggestedQuestions.security.q1"),
      t("suggestedQuestions.security.q2"),
      t("suggestedQuestions.security.q3"),
      t("suggestedQuestions.security.q4"),
    ],
    analytics: [
      t("suggestedQuestions.analytics.q1"),
      t("suggestedQuestions.analytics.q2"),
      t("suggestedQuestions.analytics.q3"),
      t("suggestedQuestions.analytics.q4"),
    ],

  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);


  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 transition ${isMinimized ? 'h-14' : 'h-[500px]'} flex flex-col z-50`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-blue-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-semibold">Learnova AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)}><X size={16} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200">
              {t("welcomeMessage")}
            </div>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-gray-400 italic">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-1 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition ${activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-1">
            {suggestedQuestions[activeCategory]?.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="p-2 text-[11px] text-left border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-500 truncate transition"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={t("placeholder")}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-sm bg-transparent focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSend()}
              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              <Send size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
