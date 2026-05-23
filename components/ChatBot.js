"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
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
} from "lucide-react";

import ReactMarkdown from "react-markdown";

/**
 * react-window v2 import
 */
import { List } from "react-window";

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
  border: "border-slate-800",

  message: {
    bot: "bg-slate-800 text-slate-100",

    user:
      "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",

    avatar: {
      bot: "bg-slate-700 text-purple-300",

      user:
        "bg-gradient-to-r from-purple-600 to-indigo-600 text-white",
    },
  },

  categoryButton:
    "bg-slate-800 text-slate-300 hover:bg-slate-700",

  categoryButtonActive:
    "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg",

  suggestion:
    "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
};

const markdownComponents = {
  p: ({ children }) => (
    <p className="text-sm leading-relaxed">
      {children}
    </p>
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-purple-300">
      {children}
    </strong>
  ),

  code: ({ children }) => (
    <code className="bg-slate-900 px-1 py-0.5 rounded text-pink-300 text-xs">
      {children}
    </code>
  ),
};

const MessageRow = ({
  index,
  style,
  data,
}) => {
  const message =
    data.messages[index];

  return (
    <div
      style={style}
      className="px-3 py-2"
    >
      <div
        className={`flex ${
          message.role === "assistant"
            ? "justify-start"
            : "justify-end"
        }`}
      >
        <div
          className={`flex max-w-sm lg:max-w-md gap-2 ${
            message.role === "assistant"
              ? "flex-row"
              : "flex-row-reverse"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === "assistant"
                ? themeClasses.message.avatar.bot
                : themeClasses.message.avatar.user
            }`}
          >
            {message.role ===
            "assistant" ? (
              <Bot size={16} />
            ) : (
              <User size={16} />
            )}
          </div>

          <div
            className={`px-4 py-3 rounded-2xl shadow-sm ${
              message.role ===
              "assistant"
                ? themeClasses.message.bot
                : themeClasses.message.user
            }`}
          >
            {message.role ===
            "assistant" ? (
              <ReactMarkdown
                components={
                  markdownComponents
                }
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="text-sm whitespace-pre-line leading-relaxed">
                {message.content}
              </p>
            )}

            <p className="text-xs mt-2 opacity-70">
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
          "Hello! I am **Learnova AI**, your learning companion. Ask me anything to get started.",
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

  const listRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (listRef.current) {
      try {
        listRef.current.scrollToRow({
          index:
            messages.length - 1,
        });
      } catch (err) {
        console.error(err);
      }
    }
  }, [messages]);

  // Check API availability
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

  const itemData = useMemo(
    () => ({
      messages,
    }),
    [messages]
  );

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto bg-slate-950 text-white border-x border-slate-800">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600">
            <Sparkles size={18} />
          </div>

          <div>
            <h1 className="font-bold text-lg">
              Nova AI
            </h1>

            <p className="text-xs text-slate-400">
              Learnova Assistant
            </p>
          </div>
        </div>

        {hasApiKey ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Live
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <AlertCircle size={12} />
            Sandbox
          </span>
        )}
      </header>

      {/* Categories */}
      <div className="p-3 border-b border-slate-800 overflow-x-auto">
        <div className="flex gap-2">
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
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
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
      <main className="flex-1 overflow-hidden">

        <List
          ref={listRef}
          style={{
            height: 500,
            width: "100%",
          }}
          rowCount={
            messages.length
          }
          rowHeight={120}
          rowComponent={
            MessageRow
          }
          rowProps={{
            data: itemData,
          }}
        />

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-4 pb-4 space-y-2">

            <p className="text-sm text-slate-400">
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
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-all ${themeClasses.suggestion}`}
                >
                  {question}
                </button>
              )
            )}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 w-fit">

              <div className="flex gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>

                <span
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{
                    animationDelay:
                      "0.15s",
                  }}
                ></span>

                <span
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{
                    animationDelay:
                      "0.3s",
                  }}
                ></span>
              </div>

              <span className="text-xs text-slate-400">
                Nova is thinking...
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/70">

        <div className="flex justify-center gap-4 text-xs">

          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="flex items-center gap-1 text-blue-400 hover:underline"
          >
            <Mail size={12} />
            Email
          </a>

          <a
            href={`tel:${CONTACT_INFO.phone}`}
            className="flex items-center gap-1 text-green-400 hover:underline"
          >
            <Phone size={12} />
            Call
          </a>

          <a
            href={CONTACT_INFO.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-400 hover:underline"
          >
            <ExternalLink size={12} />
            Demo
          </a>
        </div>
      </div>

      {/* Input */}
      <footer className="p-4 border-t border-slate-800 bg-slate-900/90">

        <form
          onSubmit={
            handleSendMessage
          }
          className="flex items-end gap-2 bg-slate-800 border border-slate-700 rounded-xl p-2"
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
            className="flex-1 bg-transparent outline-none resize-none text-sm text-slate-200 placeholder-slate-500 max-h-32"
          />

          <button
            type="submit"
            disabled={
              !inputMessage.trim() ||
              isLoading
            }
            className={`p-3 rounded-lg transition-all ${
              inputMessage.trim() &&
              !isLoading
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-500 mt-2">
          Powered by Groq API
        </p>
      </footer>
    </div>
  );
};

export default LearnovaChatbot;
