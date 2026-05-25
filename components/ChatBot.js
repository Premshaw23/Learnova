"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Moon,
  Sun,
  Mail,
  Phone,
  ExternalLink,
  RefreshCw,
  BookOpen,
  Shield,
  BarChart3,
  Zap,
  Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTheme } from "next-themes";

import { useAuthContext } from "@/contexts/AuthContext";

// ---------------------------------------------------------------------------
// Constants — centralized
// ---------------------------------------------------------------------------
import { CONTACT_INFO } from '../constants/contact';

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------
const learnovaKnowledge = {
  platform:
    "Learnova is a comprehensive Smart Student Engagement Ecosystem that combines attendance automation, smart curriculum activities, AI-powered personalization, and real-time communication for educational institutions.",

  attendance: {
    features: [
      "GPS Geofencing + Time Window validation",
      "Multi-factor authentication (GPS + Time + Optional QR)",
      "Face liveness detection for anti-proxy measures",
      "Offline-first storage with automatic sync",
      "Exception handling with teacher approval workflow",
      "6-8 digit secure passcodes with special characters",
      "Device fingerprinting and session management",
    ],
    benefits:
      "Saves ~1 hour daily per teacher, 99%+ accuracy, eliminates proxy attendance",
  },

  security: {
    features: [
      "End-to-end encrypted routes with JWT tokens",
      "Role-based access (Student/Teacher/Admin/Parent)",
      "AES-256 database encryption",
      "Triple verification (Mobile + Email + Institute code)",
      "Real-time fraud detection and IP tracking",
      "GDPR and FERPA compliance",
      "Duplicate page blocking and session timeout",
    ],
    privacy:
      "Privacy-first architecture with data minimization and user consent management",
  },

  activities: {
    types: [
      "Interactive quizzes and gamified MCQs",
      "Coding challenges and programming puzzles",
      "AI-powered personalized recommendations",
      "Career goal mapping and skill assessments",
      "Leaderboards and achievement systems",
      "Collaborative learning and study groups",
    ],
    impact: "Converts 90+ idle hours yearly into productive learning",
  },

  analytics: {
    dashboards: [
      "Unified student progress tracking",
      "Teacher management tools with trend analysis",
      "Administrative heatmaps and insights",
      "Parent visibility into child's performance",
      "Export capabilities (CSV/PDF/Excel)",
      "Predictive analytics for early intervention",
    ],
  },

  technology: {
    frontend: "Next.js PWA with TailwindCSS, offline-first architecture",
    backend: "Node.js/NestJS with Firebase/PostgreSQL",
    ai: "Python microservices for personalized recommendations",
    security: "Firebase Auth with multi-factor validation",
    deployment: "Vercel frontend, scalable cloud backend",
  },
};

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------
const categories = [
  { id: "general", label: "General", icon: BookOpen },
  { id: "attendance", label: "Attendance", icon: Clock },
  { id: "activities", label: "Activities", icon: Zap },
  { id: "security", label: "Security", icon: Shield },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const suggestedQuestions = {
  general: [
    "What is Learnova and how does it work?",
    "How does Learnova differ from traditional attendance systems?",
    "What are the main benefits for students and teachers?",
    "Is Learnova suitable for both schools and colleges?",
  ],
  attendance: [
    "How does the GPS + Time validation work?",
    "What happens if a student misses attendance?",
    "How does face recognition prevent proxy attendance?",
    "Can the system work offline?",
  ],
  activities: [
    "What types of smart activities are available?",
    "How does AI personalize learning recommendations?",
    "How do leaderboards and gamification work?",
    "Can students access activities without logging in?",
  ],
  security: [
    "What encryption and security measures are used?",
    "How is student data protected and stored?",
    "What are the different user roles and permissions?",
    "How does the platform ensure GDPR compliance?",
  ],
  analytics: [
    "What insights do teachers get from dashboards?",
    "How can parents track their child's progress?",
    "What reporting options are available?",
    "How does predictive analytics help identify at-risk students?",
  ],
};

const fallbackResponses = {
  general: `I'm Learnova's AI assistant. While I may not have an answer for that specific question, our team is happy to help!\n\n📧 **Email:** ${CONTACT_INFO.email}\n📞 **Phone:** ${CONTACT_INFO.phone}\n🎯 **Schedule Demo:** ${CONTACT_INFO.demo}`,
  attendance:
    "I didn't quite catch that. Try asking about GPS validation, offline sync, or proxy prevention.",
  activities:
    "I didn't quite catch that. Try asking about quiz types, gamification, or AI recommendations.",
  security:
    "I didn't quite catch that. Try asking about encryption, roles, or GDPR compliance.",
  analytics:
    "I didn't quite catch that. Try asking about dashboards, exports, or predictive analytics.",
};

// ---------------------------------------------------------------------------
// Custom Syntax Highlighting & Code Block Rendering
// ---------------------------------------------------------------------------
function highlightCode(code, language) {
  if (!code) return "";
  const lang = (language || "").toLowerCase();

  const jsKeywords = /\b(const|let|var|function|return|import|export|class|if|else|for|while|try|catch|finally|true|false|null|undefined|new|this|typeof|instanceof|async|await|default|extends|from)\b/g;
  const pyKeywords = /\b(def|class|return|if|elif|else|for|while|try|except|finally|import|from|as|in|is|not|and|or|True|False|None|lambda|pass|break|continue|with|assert)\b/g;
  const cppKeywords = /\b(int|float|double|char|bool|void|class|struct|public|private|protected|template|typename|return|if|else|for|while|do|switch|case|default|break|continue|new|delete|namespace|using|std|cout|cin|endl)\b/g;
  const bashKeywords = /\b(echo|exit|cd|ls|mkdir|rm|cp|mv|sudo|apt|git|if|then|else|fi|for|in|do|done|while|case|esac|function)\b/g;

  let keywordRegex = jsKeywords;
  if (lang === "python" || lang === "py") keywordRegex = pyKeywords;
  else if (lang === "cpp" || lang === "c++" || lang === "c") keywordRegex = cppKeywords;
  else if (lang === "bash" || lang === "sh") keywordRegex = bashKeywords;
  else if (lang === "json") keywordRegex = /\b(true|false|null)\b/g;

  const tokenRegex = new RegExp(
    `(\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)|` + // Group 1: Comments
    `("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\\\n]|\\\\.)*\`)|` + // Group 2: Strings
    `(\\b\\d+(?:\\.\\d+)?\\b)|` + // Group 3: Numbers
    `(${keywordRegex.source})|` + // Group 4: Keywords
    `(\\b[a-zA-Z_]\\w*(?=\\())`, // Group 5: Functions
    "g"
  );

  const elements = [];
  let lastIndex = 0;
  let match;

  tokenRegex.lastIndex = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    const textBefore = code.slice(lastIndex, match.index);
    if (textBefore) {
      elements.push(textBefore);
    }

    const matchedText = match[0];
    if (match[1]) {
      elements.push(<span key={match.index} className="text-gray-500 italic">{matchedText}</span>);
    } else if (match[2]) {
      elements.push(<span key={match.index} className="text-emerald-400">{matchedText}</span>);
    } else if (match[3]) {
      elements.push(<span key={match.index} className="text-amber-400">{matchedText}</span>);
    } else if (match[4]) {
      elements.push(<span key={match.index} className="text-pink-400 font-semibold">{matchedText}</span>);
    } else if (match[5]) {
      elements.push(<span key={match.index} className="text-sky-400">{matchedText}</span>);
    } else {
      elements.push(matchedText);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  const textRemaining = code.slice(lastIndex);
  if (textRemaining) {
    elements.push(textRemaining);
  }

  return elements;
}

const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-white/10 bg-gray-950/90 shadow-lg shadow-purple-950/20 max-w-full">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-900/80 border-b border-white/5 text-[10px] text-gray-400 font-mono select-none">
        <span className="uppercase tracking-wider">{language || "code"}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors duration-150 px-2 py-0.5 rounded hover:bg-white/5 cursor-pointer"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-gray-200 scrollbar-none whitespace-pre select-text">
        <code>{highlightCode(code, language)}</code>
      </pre>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Markdown renderer components
// ---------------------------------------------------------------------------
const markdownComponents = {
  p: ({ children }) => (
    <p className="my-2 text-sm leading-relaxed text-gray-200 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-purple-400">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-blue-400">{children}</em>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold mt-4 mb-2 text-white border-b border-white/10 pb-1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-semibold mt-3 mb-1.5 text-purple-300">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xs font-semibold mt-2.5 mb-1 text-blue-300">{children}</h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-purple-500 bg-purple-950/20 px-3 py-1.5 my-2 rounded-r-lg italic text-gray-300">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 space-y-1.5 my-2 text-sm">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 space-y-1.5 my-2 text-sm">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed text-sm text-gray-300">{children}</li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-purple-400 hover:text-purple-300 underline underline-offset-4 decoration-purple-500/50 hover:decoration-purple-400 transition-colors duration-150 inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink size={10} className="shrink-0" />
    </a>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-gray-900/40 backdrop-blur-sm max-w-full scrollbar-none">
      <table className="min-w-full divide-y divide-white/10 text-xs text-left">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-purple-950/40 text-purple-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-white/5 transition-colors duration-150">{children}</tr>,
  th: ({ children }) => <th className="px-3 py-2 font-semibold border-b border-white/10">{children}</th>,
  td: ({ children }) => <td className="px-3 py-2 text-gray-300 border-b border-white/5">{children}</td>,
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const codeString = String(children).replace(/\n$/, "");

    if (!match && !codeString.includes("\n")) {
      return (
        <code className="px-1.5 py-0.5 rounded-md text-xs bg-purple-950/40 text-purple-200 border border-purple-800/30 font-mono" {...props}>
          {children}
        </code>
      );
    }

    return <CodeBlock language={language} code={codeString} />;
  }
};

// ---------------------------------------------------------------------------
// Bot response logic
// ---------------------------------------------------------------------------
async function generateBotResponse(userMessage, currentCategory, idToken) {
  const lower = userMessage.toLowerCase();

  // Greetings
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! Welcome to Learnova — your Smart Student Engagement Ecosystem! I'm Nova, and I'm here to help:\n\n🎯 **Attendance Automation** — GPS + Time + Optional QR validation\n📚 **Smart Activities** — Turn idle hours into learning hours\n🔒 **Advanced Security** — Multi-factor authentication & encryption\n📊 **Analytics Dashboard** — Real-time insights for all stakeholders\n\nWhat would you like to explore first?";
  }

  // Attendance
  if (lower.includes("attendance") || lower.includes("marking") || lower.includes("present")) {
    return `📋 **Learnova Attendance System**\n\n**Key Features:**\n${learnovaKnowledge.attendance.features.map((f) => `• ${f}`).join("\n")}\n\n**Benefits:**\n• ${learnovaKnowledge.attendance.benefits}\n• Works offline with auto-sync\n• Exception handling with teacher approval\n• Real-time transparency for parents\n\n**Flow:** Phone Verified → GPS + Time Check → Optional QR Scan → Offline Storage → Server Sync → Final Status\n\nWant to know more about any specific aspect?`;
  }

  // Security / Privacy
  if (lower.includes("security") || lower.includes("privacy") || lower.includes("safe") || lower.includes("protection")) {
    return `🔒 **Security & Privacy Features**\n\n**Advanced Security:**\n${learnovaKnowledge.security.features.map((f) => `• ${f}`).join("\n")}\n\n**Privacy Protection:**\n• ${learnovaKnowledge.security.privacy}\n• Anonymous analytics options\n• Right to data deletion\n• Secure data export/import\n\n**Compliance:** GDPR, FERPA, SOC 2, ISO 27001\n\nNeed details about any specific security measure?`;
  }

  // Activities / Gamification
  if (lower.includes("activity") || lower.includes("quiz") || lower.includes("game") || lower.includes("learning")) {
    return `🎮 **Smart Activity Hub**\n\n**Activity Types:**\n${learnovaKnowledge.activities.types.map((t) => `• ${t}`).join("\n")}\n\n**AI Personalization:**\n• Career goal mapping\n• Skill-based recommendations\n• Adaptive difficulty levels\n• Progress-based suggestions\n\n**Gamification:**\n• Badges and achievement systems\n• Class-wide leaderboards\n• Streak maintenance\n• Peer challenges\n\n**Impact:** ${learnovaKnowledge.activities.impact}\n\nInterested in trying our demo activities?`;
  }

  // Analytics / Dashboards
  if (lower.includes("dashboard") || lower.includes("analytics") || lower.includes("report") || lower.includes("insight")) {
    return `📊 **Analytics & Dashboards**\n\n**Available Dashboards:**\n${learnovaKnowledge.analytics.dashboards.map((d) => `• ${d}`).join("\n")}\n\n**Key Metrics:**\n• Attendance patterns and trends\n• Activity engagement rates\n• Learning progress tracking\n• Time utilization analysis\n• Performance predictions\n\n**Export Options:** CSV, PDF, Excel formats | Scheduled automated reports | Custom report builder\n\nWhich dashboard would you like to learn more about?`;
  }

  // Tech stack
  if (lower.includes("technical") || lower.includes("technology") || lower.includes("stack") || lower.includes("api")) {
    return `⚙️ **Technical Specifications**\n\n**Frontend:** ${learnovaKnowledge.technology.frontend}\n**Backend:** ${learnovaKnowledge.technology.backend}\n**AI Engine:** ${learnovaKnowledge.technology.ai}\n**Security:** ${learnovaKnowledge.technology.security}\n**Deployment:** ${learnovaKnowledge.technology.deployment}\n\n**Key Features:** PWA | Offline-first | Cross-platform | Real-time sync | Scalable microservices | RESTful + GraphQL APIs\n\nNeed more details about any specific component?`;
  }

  // Pricing
  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("subscription")) {
    return `💰 **Learnova Pricing Plans**\n\n🆓 **Free Tier (Trial)**\n• Up to 50 students | Basic attendance | Limited activities | Standard support\n\n🏫 **Institution Plan**\n• Unlimited students | Full feature access | Advanced analytics | Priority support | Custom integrations | Training included\n\n🏢 **Enterprise**\n• Multi-campus support | White-label options | Dedicated support | Custom development | SLA guarantees\n\nContact our team for personalized pricing!`;
  }

  // Setup / Getting started
  if (lower.includes("setup") || lower.includes("implement") || lower.includes("install") || lower.includes("start")) {
    return `🚀 **Getting Started with Learnova**\n\n1️⃣ **Institution Registration** — Provide basic details\n2️⃣ **System Configuration** — Customize settings\n3️⃣ **User Import** — Bulk upload student/teacher data\n4️⃣ **Training Sessions** — Staff onboarding workshops\n5️⃣ **Pilot Testing** — Start with selected classes\n6️⃣ **Full Deployment** — Institution-wide rollout\n\n**Implementation Support:** Dedicated onboarding manager | 24/7 support during transition | Data migration assistance\n\n**Timeline:** Typically 2–4 weeks from signup to full deployment\n\nReady to schedule a demo?`;
  }

  // Support / Contact / Demo
  if (lower.includes("support") || lower.includes("help") || lower.includes("contact") || lower.includes("demo")) {
    return `🛟 **Support & Contact**\n\n📧 **Email:** ${CONTACT_INFO.email}\n📞 **Phone:** ${CONTACT_INFO.phone}\n🌐 **Website:** ${CONTACT_INFO.website}\n🎯 **Live Demo:** ${CONTACT_INFO.demo}\n\n**Response Times:**\n• General inquiries: Within 4 hours\n• Technical issues: Within 2 hours\n• Urgent/Critical: Within 30 minutes\n\nHow can I connect you with the right channel?`;
  }

  // Try API
  try {
    const headers = { "Content-Type": "application/json" };
    if (idToken) {
      headers["Authorization"] = `Bearer ${idToken}`;
    }
    const response = await fetch("/api/groq", {
      method: "POST",
      headers,
      body: JSON.stringify({ message: userMessage, category: currentCategory }),
    });

    if (response.ok) {
      const payload = await response.json();
      const content = payload?.data?.message || payload?.message;
      if (content) return content;
    }
  } catch {
    // fall through to fallback
  }

  return fallbackResponses[currentCategory] ?? fallbackResponses.general;
}

// ---------------------------------------------------------------------------
// Save conversation helper
// ---------------------------------------------------------------------------
async function saveConversation(userText, botText) {
  try {
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userMessage: userText, botMessage: botText }),
    });
  } catch {
    // silently ignore
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const LearnovaChatbot = () => {
  // Get the Firebase user object so we can fetch a fresh ID token per request
  const { user } = useAuthContext();

  const INITIAL_MESSAGE = {
    id: 1,
    text: "Hello! I'm Nova, your AI assistant for Learnova — the Smart Student Engagement Ecosystem! I can help you with attendance management, smart activities, security features, analytics, and more. What would you like to know?",
    isBot: true,
    timestamp: new Date(),
  };

  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark" || theme === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("general");

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const userHasScrolledUp = useRef(false);

  useEffect(() => {
    if (!inputMessage && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputMessage]);

  // Handle manual scroll monitoring to pause/resume autoscroll
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // If the scroll is near the bottom (within 40px), consider it at bottom and allow autoscroll
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
    userHasScrolledUp.current = !isAtBottom;
  };

  // Auto scroll within the chat panel only (avoid scrolling the page)
  useEffect(() => {
    if (!isOpen || isMinimized) return;
    if (userHasScrolledUp.current) return;

    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    setCurrentCategory("general");
    userHasScrolledUp.current = false;
  };

  const handleSendMessage = useCallback(
    async (messageText) => {
      const text = (typeof messageText === "string" ? messageText : inputMessage).trim();
      if (!text || isLoading) return;

      const userMsg = {
        id: Date.now(),
        text,
        isBot: false,
        timestamp: new Date(),
      };

      userHasScrolledUp.current = false;
      setMessages((prev) => [...prev, userMsg]);
      setInputMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      // Small delay for UX
      await new Promise((r) => setTimeout(r, 600));

      let botText = "";
      try {
        if (!user) {
          botText = "**Please sign in** to use the AI chatbot.";
        } else {
          const idToken = await user.getIdToken();
          botText = await generateBotResponse(text, currentCategory, idToken);
        }
      } catch {
        botText = `I apologize for the technical difficulty. Our team is here to help:\n\n📧 **Email:** ${CONTACT_INFO.email}\n📞 **Phone:** ${CONTACT_INFO.phone}\n🎯 **Live Demo:** ${CONTACT_INFO.demo}`;
      }

      const botMsg = {
        id: Date.now() + 1,
        text: botText,
        isBot: true,
        timestamp: new Date(),
      };

      userHasScrolledUp.current = false;
      setMessages((prev) => [...prev, botMsg]);
      setIsLoading(false);

      await saveConversation(text, botText);
    },
    [inputMessage, isLoading, currentCategory, user]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---------------------------------------------------------------------------
  // Theme tokens - Enhanced for rich glassmorphism & premium UI spacing
  // ---------------------------------------------------------------------------
  const t = {
    bg: isDarkMode 
      ? "bg-gray-950/90 backdrop-blur-xl text-white" 
      : "bg-white/95 backdrop-blur-xl text-gray-900",
    header: "bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 border-b border-white/10 shadow-lg shadow-purple-950/20",
    border: isDarkMode ? "border-white/10" : "border-gray-200/80",
    botMsg: isDarkMode
      ? "bg-white/[0.04] text-gray-200 border border-white/5 shadow-[0_4px_24px_rgba(139,92,246,0.15)]"
      : "bg-gray-900/[0.03] text-gray-800 border border-black/5 shadow-[0_4px_20px_rgba(139,92,246,0.06)]",
    userMsg: "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_4px_18px_rgba(139,92,246,0.25)] text-white border border-purple-500/10",
    botAvatar: isDarkMode ? "bg-purple-800/80 text-purple-300 border border-purple-500/20" : "bg-purple-100 text-purple-600 border border-purple-200",
    userAvatar: isDarkMode ? "bg-indigo-800/80 text-indigo-300 border border-indigo-500/20" : "bg-indigo-100 text-indigo-600 border border-indigo-200",
    input: isDarkMode
      ? "bg-white/[0.03] border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-450 focus:ring-2 focus:ring-purple-400 focus:border-transparent",
    catBtn: isDarkMode ? "hover:bg-white/[0.05] text-gray-300" : "hover:bg-gray-100 text-gray-600",
    catBtnActive: isDarkMode ? "bg-purple-800/60 text-purple-200 border border-purple-500/30" : "bg-purple-100 text-purple-700 border border-purple-200",
    suggestion: isDarkMode
      ? "bg-purple-950/40 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40 shadow-sm"
      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-sm",
    loading: isDarkMode ? "bg-white/[0.04] border border-white/5" : "bg-gray-50 border border-black/5",
    dot: isDarkMode ? "text-gray-400" : "text-gray-500",
  };

  // ---------------------------------------------------------------------------
  // Closed state — floating button
  // ---------------------------------------------------------------------------
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
          aria-label="Open Nova chat"
        >
          <MessageCircle size={24} />
          {/* Pulse badge */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            <Sparkles size={14} />
          </span>
          {/* Tooltip */}
          <span className="absolute -left-28 -top-10 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Ask Nova anything!
          </span>
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Open state — chat window
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`fixed z-50 flex flex-col ${t.bg} shadow-2xl transition-all duration-300 border ${t.border} ${
        isMinimized ? "bottom-6 right-6 w-72 h-16 overflow-hidden rounded-xl" : "bottom-0 right-0 w-full h-full rounded-none sm:bottom-6 sm:right-6 sm:w-96 sm:h-[660px] sm:rounded-xl"
      }`}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`${t.header} text-white p-4 rounded-t-xl flex items-center justify-between shrink-0`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="text-yellow-300" size={22} />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">Nova AI</h3>
            <p className="text-xs opacity-90 flex items-center gap-1 mt-0.5">
              <Sparkles size={10} /> Learnova Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button onClick={clearChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Clear chat">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setTheme(isDarkMode ? "light" : "dark")} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Toggle theme">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title={isMinimized ? "Expand" : "Minimize"}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 sm:p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Close" aria-label="Close chat">
            <X size={20} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Everything below is hidden when minimized */}
      {!isMinimized && (
        <>
          {/* ── Category Tabs ────────────────────────────────────────────── */}
          <div className={`p-2 border-b ${t.border} shrink-0`}>
            <div className="flex space-x-1 overflow-x-auto scrollbar-none">
              {categories.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentCategory(id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${
                    currentCategory === id ? t.catBtnActive : t.catBtn
                  }`}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Messages Area ─────────────────────────────────────────────── */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-none"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex animate-fadeIn ${
  message.isBot ? "justify-start" : "justify-end"
}`}
              >
                <div className={`flex max-w-[85%] items-end gap-2 ${message.isBot ? "flex-row" : "flex-row-reverse"}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.isBot ? t.botAvatar : t.userAvatar}`}>
                    {message.isBot ? <Bot size={16} /> : <User size={16} />}
                  </div>

                  {/* Bubble */}
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${message.isBot ? t.botMsg : t.userMsg}`}>
                    {message.isBot ? (
                      <ReactMarkdown components={markdownComponents}>
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.text}
                      </p>
                    )}
                    <p className="text-xs mt-2 opacity-60">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Suggested questions — shown only with the welcome message */}
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className={`text-xs font-medium text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  💡 Popular questions about{" "}
                  {categories.find((c) => c.id === currentCategory)?.label}:
                </p>
                {suggestedQuestions[currentCategory]?.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all duration-200 hover:scale-[1.01] ${t.suggestion}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`${t.loading} rounded-2xl px-4 py-3 shadow-sm`}>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {[0, 0.1, 0.2].map((delay, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${delay}s` }}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      Analyzing your question...
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ── Quick Contact Bar ─────────────────────────────────────────── */}
          <div className={`px-4 py-2 border-t ${t.border} shrink-0`}>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <a
                href={`mailto:${CONTACT_INFO.email}`}
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}
              >
                <Mail size={12} />
                <span>Email</span>
              </a>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-green-400" : "text-green-600"}`}
              >
                <Phone size={12} />
                <span>Call</span>
              </a>
              <a
                href={CONTACT_INFO.demo}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}
              >
                <ExternalLink size={12} />
                <span>Demo</span>
              </a>
            </div>
          </div>

          {/* ── Input ─────────────────────────────────────────────────────── */}
          <div className={`p-4 border-t ${t.border} shrink-0`}>
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder="Ask Nova about Learnova…"
                rows={1}
                className={`flex-1 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm ${t.input}`}
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
            <p className={`text-xs mt-2 text-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              Powered by Nova AI · Shift + Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default LearnovaChatbot;
