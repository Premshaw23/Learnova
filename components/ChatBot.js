"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import {
  Send,
  Bot,
  User,
  MessageSquare,
  GraduationCap,
  Code,
  Compass,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  ExternalLink,
  X,
} from "lucide-react";

import ReactMarkdown from "react-markdown";

import { CONTACT_INFO } from "../constants/contact";

const categories = [
  {
    id: "all",
    label: "General",
    icon: MessageSquare,
  },
  {
    id: "academics",
    label: "Academics",
    icon: GraduationCap,
  },
  {
    id: "coding",
    label: "Coding Help",
    icon: Code,
  },
  {
    id: "career",
    label: "Career Guidance",
    icon: Compass,
  },
];

const fallbackResponses = {
  academics:
    "To understand academic topics better, break them into fundamentals and core concepts.",

  coding:
    "When debugging, start with the error message, verify environment variables, and isolate failing components.",

  career:
    "Career growth comes from combining technical depth with communication and problem-solving skills.",

  all:
    "I'm here to help. Please provide more context so I can answer precisely.",
};

const suggestedQuestions = {
  all: [
    "What is Learnova?",
    "How does the AI chatbot work?",
    "What technologies power this platform?",
  ],

  academics: [
    "How can I improve productivity?",
    "Best techniques for exam preparation?",
    "How to manage study time effectively?",
  ],

  coding: [
    "How do I debug React apps?",
    "Explain Next.js routing",
    "Best practices for MERN stack?",
  ],

  career: [
    "How do I prepare for placements?",
    "How can I improve my resume?",
    "What skills are in demand now?",
  ],
};

const themeClasses = {
  message: {
    bot: "bg-white border border-slate-200 text-slate-800",

    user:
      "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",

    avatar: {
      bot: "bg-slate-100 text-slate-700",

      user:
        "bg-gradient-to-r from-indigo-600 to-purple-600 text-white",
    },
  },

  categoryButton:
    "bg-slate-100 text-slate-700 hover:bg-slate-200",

  categoryButtonActive:
    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md",

  suggestion:
    "bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700",
};

const markdownComponents = {
  p: ({ children }) => (
    <p className="text-sm leading-relaxed">
      {children}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-indigo-600">
      {children}
    </strong>
  ),

  code: ({ children }) => (
    <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs">
      {children}
    </code>
  ),
};

const MessageBubble = ({
  message,
}) => {
  const isBot =
    message.role === "assistant";

  return (
    <div
      className={`flex ${
        isBot
          ? "justify-start"
          : "justify-end"
      }`}
    >
      <div
        className={`flex items-end gap-2 max-w-[90%] sm:max-w-[75%] ${
          isBot
            ? "flex-row"
            : "flex-row-reverse"
        }`}
      >
        {/* Avatar */}
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
            isBot
              ? themeClasses.message.avatar.bot
              : themeClasses.message.avatar.user
          }`}
        >
          {isBot ? (
            <Bot size={16} />
          ) : (
            <User size={16} />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isBot
              ? themeClasses.message.bot
              : themeClasses.message.user
          }`}
        >
          {isBot ? (
            <ReactMarkdown
              components={
                markdownComponents
              }
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          )}

          <p className="text-[11px] opacity-70 mt-2">
            {new Date(
              message.timestamp
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

const LearnovaChatbot = () => {
  const [messages, setMessages] =
    useState([
      {
        id: 1,
        role: "assistant",
        content:
          "Hello! I am **Nova AI**, your Learnova assistant. Ask me anything.",
        timestamp: Date.now(),
      },
    ]);

  const [inputMessage, setInputMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [currentCategory, setCurrentCategory] =
    useState("all");

  const [hasApiKey, setHasApiKey] =
    useState(false);

  const textareaRef = useRef(null);

  const messagesEndRef =
    useRef(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  // API status
  useEffect(() => {
    let mounted = true;

    fetch("/api/check-groq-config")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) {
          setHasApiKey(
            !!data?.hasKey
          );
        }
      })
      .catch(() => {
        setHasApiKey(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Resize textarea
  const handleInputChange = (
    e
  ) => {
    setInputMessage(
      e.target.value
    );

    if (textareaRef.current) {
      textareaRef.current.style.height =
        "auto";

      textareaRef.current.style.height = `${Math.min(
        textareaRef.current
          .scrollHeight,
        120
      )}px`;
    }
  };

  // Send message
  const handleSendMessage =
    useCallback(
      async (e) => {
        e.preventDefault();

        if (
          !inputMessage.trim() ||
          isLoading
        ) {
          return;
        }

        const userQuery =
          inputMessage.trim();

        const userMessage = {
          id: Date.now(),

          role: "user",

          content: userQuery,

          timestamp:
            Date.now(),
        };

        setMessages((prev) => [
          ...prev,
          userMessage,
        ]);

        setInputMessage("");

        if (textareaRef.current) {
          textareaRef.current.style.height =
            "auto";
        }

        setIsLoading(true);

        try {
          const response =
            await fetch("/api/groq", {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                message: userQuery,

                category:
                  currentCategory,
              }),
            });

          if (!response.ok) {
            throw new Error(
              "API request failed"
            );
          }

          const data =
            await response.json();

          setMessages((prev) => [
            ...prev,
            {
              id:
                Date.now() + 1,

              role:
                "assistant",

              content:
                data?.message ||
                "No response generated.",

              timestamp:
                Date.now(),
            },
          ]);
        } catch (error) {
          console.error(
            "Chatbot Error:",
            error
          );

          setMessages((prev) => [
            ...prev,
            {
              id:
                Date.now() + 1,

              role:
                "assistant",

              content: `**Offline Mode:** ${fallbackResponses[currentCategory]}`,

              timestamp:
                Date.now(),
            },
          ]);
        } finally {
          setIsLoading(false);
        }
      },
      [
        inputMessage,
        isLoading,
        currentCategory,
      ]
    );

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-4xl mx-auto bg-slate-50 border-x border-slate-200">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white border-b border-slate-200">

        <div className="flex items-center gap-3">

          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
            <Sparkles size={18} />
          </div>

          <div>
            <h1 className="font-bold text-lg text-slate-800">
              Nova AI
            </h1>

            <p className="text-xs text-slate-500">
              Learnova Assistant
            </p>
          </div>
        </div>

        {hasApiKey ? (
          <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle2 size={12} />
            Live
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
            <AlertCircle size={12} />
            Sandbox
          </div>
        )}
      </header>

      {/* Categories */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 overflow-x-auto">

        <div className="flex gap-2 min-w-max">

          {categories.map(
            ({
              id,
              label,
              icon: Icon,
            }) => (
              <button
                key={id}
                onClick={() =>
                  setCurrentCategory(
                    id
                  )
                }
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  currentCategory === id
                    ? themeClasses.categoryButtonActive
                    : themeClasses.categoryButton
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {messages.map(
          (message) => (
            <MessageBubble
              key={message.id}
              message={message}
            />
          )
        )}

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="space-y-2 pt-2">

            <p className="text-sm text-slate-500">
              Suggested Questions
            </p>

            {suggestedQuestions[
              currentCategory
            ]?.map(
              (
                question,
                index
              ) => (
                <button
                  key={index}
                  onClick={() =>
                    setInputMessage(
                      question
                    )
                  }
                  className={`block w-full text-left text-sm px-4 py-3 rounded-xl transition-all ${themeClasses.suggestion}`}
                >
                  {question}
                </button>
              )
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center gap-2">

            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
              <Bot size={16} />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>

              <span
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{
                  animationDelay:
                    "0.15s",
                }}
              ></span>

              <span
                className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                style={{
                  animationDelay:
                    "0.3s",
                }}
              ></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Footer Links */}
      <div className="px-4 py-2 bg-white border-t border-slate-200">

        <div className="flex justify-center gap-4 text-xs">

          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-1 text-blue-600 hover:underline"
          >
            <Mail size={12} />
            Email
          </a>

          <a
            href={`tel:${CONTACT_INFO.phone}`}
            className="flex items-center gap-1 text-green-600 hover:underline"
          >
            <Phone size={12} />
            Call
          </a>

          <a
            href={CONTACT_INFO.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-600 hover:underline"
          >
            <ExternalLink size={12} />
            Demo
          </a>
        </div>
      </div>

      {/* Input */}
      <footer className="p-4 bg-white border-t border-slate-200">

        <form
          onSubmit={
            handleSendMessage
          }
          className="flex items-end gap-2 bg-slate-100 border border-slate-200 rounded-2xl p-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={
              handleInputChange
            }
            onKeyDown={(e) => {
              if (
                e.key ===
                  "Enter" &&
                !e.shiftKey
              ) {
                e.preventDefault();

                handleSendMessage(
                  e
                );
              }
            }}
            placeholder={`Ask something in ${
              categories.find(
                (c) =>
                  c.id ===
                  currentCategory
              )?.label
            }...`}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-700 placeholder-slate-400 max-h-32 px-2 py-2"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            aria-label="Send message"
            className={`p-2.5 rounded-lg transition-all ${
              inputMessage.trim() && !isLoading
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 mt-2">
          Powered by Groq API
        </p>
      </footer>
    </div>
  );
};

export default LearnovaChatbot;