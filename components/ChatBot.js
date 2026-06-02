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
// 🛠️ STEP 1 IMPORT: Bring in your local fallback Intent Router interface
import { parseUserIntent } from "@/services/ai-agent/intentparser.js";
import { apiFetch } from "@/lib/apiClient";


// ---------------------------------------------------------------------------
// Constants — centralized
// ---------------------------------------------------------------------------
const CONTACT_INFO = {
  email: "support@learnova.edu",
  phone: "+1 (555) 019-2834",
  demo: "https://learnova.edu/demo",
  website: "https://learnova.edu"
};

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
    `(\\/\\/.*|#.*|\\/\\*[\\s\\S]*?\\*\\/)|` +
    `("(?:[^"\\\\\\n]|\\\\.)*"|'(?:[^'\\\\\\n]|\\\\.)*'|\`(?:[^\`\\\\\\n]|\\\\.)*\`)|` +
    `(\\b\\d+(?:\\.\\d+)?\\b)|` +
    `(${keywordRegex.source})|` +
    `(\\b[a-zA-Z_]\\w*(?=\\())`,
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
// Bot response logic
// ---------------------------------------------------------------------------
async function generateBotResponse(userMessage, currentCategory, idToken, updatedMessages = []) {
  const lower = userMessage.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! Welcome to Learnova — your Smart Student Engagement Ecosystem! I'm Nova, and I'm here to help:\n\n🎯 **Attendance Automation** — GPS + Time + Optional QR validation\n📚 **Smart Activities** — Turn idle hours into learning hours\n🔒 **Advanced Security** — Multi-factor authentication & encryption\n📊 **Analytics Dashboard** — Real-time insights for all stakeholders\n\nWhat would you like to explore first?";
  }
  if (lower.includes("attendance") || lower.includes("marking") || lower.includes("present")) {
    return `📋 **Learnova Attendance System**\n\n**Key Features:**\n${learnovaKnowledge.attendance.features.map((f) => `• ${f}`).join("\n")}\n\n**Benefits:**\n• ${learnovaKnowledge.attendance.benefits}\n• Works offline with auto-sync\n• Exception handling with teacher approval\n• Real-time transparency for parents\n\n**Flow:** Phone Verified → GPS + Time Check → Optional QR Scan → Offline Storage → Server Sync → Final Status\n\nWant to know more about any specific aspect?`;
  }
  if (lower.includes("security") || lower.includes("privacy") || lower.includes("safe") || lower.includes("protection")) {
    return `🔒 **Security & Privacy Features**\n\n**Advanced Security:**\n${learnovaKnowledge.security.features.map((f) => `• ${f}`).join("\n")}\n\n**Privacy Protection:**\n• ${learnovaKnowledge.security.privacy}\n• Anonymous analytics options\n• Right to data deletion\n• Secure data export/import\n\n**Compliance:** GDPR, FERPA, SOC 2, ISO 27001\n\nNeed details about any specific security measure?`;
  }
  if (lower.includes("activity") || lower.includes("quiz") || lower.includes("game") || lower.includes("learning")) {
    return `🎮 **Smart Activity Hub**\n\n**Activity Types:**\n${learnovaKnowledge.activities.types.map((t) => `• ${t}`).join("\n")}\n\n**AI Personalization:**\n• Career goal mapping\n• Skill-based recommendations\n• Adaptive difficulty levels\n• Progress-based suggestions\n\n**Gamification:**\n• Badges and achievement systems\n• Class-wide leaderboards\n• Streak maintenance\n• Peer challenges\n\n**Impact:** ${learnovaKnowledge.activities.impact}\n\nInterested in trying our demo activities?`;
  }
  if (lower.includes("dashboard") || lower.includes("analytics") || lower.includes("report") || lower.includes("insight")) {
    return `📊 **Analytics & Dashboards**\n\n**Available Dashboards:**\n${learnovaKnowledge.analytics.dashboards.map((d) => `• ${d}`).join("\n")}\n\n**Key Metrics:**\n• Attendance patterns and trends\n• Activity engagement rates\n• Learning progress tracking\n• Time utilization analysis\n• Performance predictions\n\n**Export Options:** CSV, PDF, Excel formats | Scheduled automated reports | Custom report builder\n\nWhich dashboard would you like to learn more about?`;
  }
  if (lower.includes("technical") || lower.includes("technology") || lower.includes("stack") || lower.includes("api")) {
    return `⚙️ **Technical Specifications**\n\n**Frontend:** ${learnovaKnowledge.technology.frontend}\n**Backend:** ${learnovaKnowledge.technology.backend}\n**AI Engine:** ${learnovaKnowledge.technology.ai}\n**Security:** ${learnovaKnowledge.technology.security}\n**Deployment:** ${learnovaKnowledge.technology.deployment}\n\n**Key Features:** PWA | Offline-first | Cross-platform | Real-time sync | Scalable microservices | RESTful + GraphQL APIs\n\nNeed more details about any specific component?`;
  }
  if (lower.includes("price") || lower.includes("cost") || lower.includes("plan") || lower.includes("subscription")) {
    return `💰 **Learnova Pricing Plans**\n\n🆓 **Free Tier (Trial)**\n• Up to 50 students | Basic attendance | Limited activities | Standard support\n\n🏫 **Institution Plan**\n• Unlimited students | Full feature access | Advanced analytics | Priority support | Custom integrations | Training included\n\n🏢 **Enterprise**\n• Multi-campus support | White-label options | Dedicated support | Custom development | SLA guarantees\n\nContact our team for personalized pricing!`;
  }
  if (lower.includes("setup") || lower.includes("implement") || lower.includes("install") || lower.includes("start")) {
    return `🚀 **Getting Started with Learnova**\n\n1️⃣ **Institution Registration** — Provide basic details\n2️⃣ **System Configuration** — Customize settings\n3️⃣ **User Import** — Bulk upload student/teacher data\n4️⃣ **Training Sessions** — Staff onboarding workshops\n5️⃣ **Pilot Testing** — Start with selected classes\n6️⃣ **Full Deployment** — Institution-wide rollout\n\n**Implementation Support:** Dedicated onboarding manager | 24/7 support during transition | Data migration assistance\n\n**Timeline:** Typically 2–4 weeks from signup to full deployment\n\nReady to schedule a demo?`;
  }
  if (lower.includes("support") || lower.includes("help") || lower.includes("contact") || lower.includes("demo")) {
    return `🛟 **Support & Contact**\n\n📧 **Email:** ${CONTACT_INFO.email}\n📞 **Phone:** ${CONTACT_INFO.phone}\n🌐 **Website:** ${CONTACT_INFO.website}\n🎯 **Live Demo:** ${CONTACT_INFO.demo}\n\n**Response Times:**\n• General inquiries: Within 4 hours\n• Technical issues: Within 2 hours\n• Urgent/Critical: Within 30 minutes\n\nHow can I connect you with the right channel?`;
  }

  try {
    const headers = { "Content-Type": "application/json" };
    if (idToken) headers["Authorization"] = `Bearer ${idToken}`;
    
    const payload = await apiFetch("/api/groq", {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        messages: updatedMessages.map(msg => ({
          role: msg.isBot ? "assistant" : "user",
          content: msg.text
        })), 
        category: currentCategory 
      }),
    });

    if (payload) {
      return payload?.data?.message || payload?.message;
    }
  } catch {
    // Fall-through to safety defaults
  }

  return fallbackResponses[currentCategory] ?? fallbackResponses.general;
}

// ---------------------------------------------------------------------------
// Save conversation helper
// ---------------------------------------------------------------------------
async function saveConversation(userText, botText, idToken) {
  if (!idToken) return;
  try {
    await apiFetch("/api/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({ userMessage: userText, botMessage: botText }),
    });
  } catch {
    // silently ignore
  }
}

// ---------------------------------------------------------------------------
// Static Initial State & Markdown Components
// ---------------------------------------------------------------------------
const INITIAL_MESSAGE = {
  id: "initial",
  text: "Hello! I'm Nova, your AI assistant for Learnova. How can I assist you today?",
  isBot: true,
  timestamp: new Date(),
};

const markdownComponents = {
  code({ node, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <CodeBlock
        language={match[1]}
        code={String(children).replace(/\n$/, "")}
      />
    ) : (
      <code className="bg-zinc-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed whitespace-pre-wrap break-words">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="mb-0.5">{children}</li>,
  h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 text-purple-400">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-bold mt-2.5 mb-1 text-purple-400">{children}</h2>,
  h3: ({ children }) => <h3 className="text-xs font-bold mt-2 mb-0.5 text-purple-400">{children}</h3>,
  a: ({ href, children }) => {
    const isInternal = href && href.startsWith("/");
    return (
      <a
        href={href}
        target={isInternal ? "_self" : "_blank"}
        rel={isInternal ? undefined : "noopener noreferrer"}
        className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
      >
        {children}
        {!isInternal && <ExternalLink size={12} className="inline shrink-0" />}
      </a>
    );
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function LearnovaChatbot() {
  const { user } = useAuthContext();
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  const isDarkMode = resolvedTheme === "dark" || theme === "dark";

  const getContextWelcomeMessage = useCallback(() => {
    if (!user) return "Hello! I'm Nova, your AI assistant for Learnova. How can I assist you today?";
    const nameSegment = user.displayName || user.email?.split('@')[0] || "there";
    const role = user.role?.toLowerCase() || "";
    if (role === "teacher" || role === "instructor") return `Hello Creator! Ready to manage your classes or check attendance logs today?`;
    if (role === "student") return `Hi ${nameSegment}, need help finding your assignments or checking your attendance?`;
    return `Hello ${nameSegment}! Welcome to Learnova. How can I help you today?`;
  }, [user]);

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("general");
  const [isScrolling, setIsScrolling] = useState(false);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (typeof window !== "undefined" && window.innerWidth >= 768) return;
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const userHasScrolledUp = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      if (!user || !isOpen) {
        if (!user) {
          setMessages([
            {
              id: "welcome",
              text: getContextWelcomeMessage(),
              isBot: true,
              timestamp: new Date(),
            }
          ]);
        }
        return;
      }

      setIsHistoryLoading(true);
      try {
        const idToken = await user.getIdToken();
        const response = await apiFetch("/api/conversations", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!isMounted) return;

        if (response && response.success !== false) {
          const payload = response;
          const history = payload?.data || [];
          if (history.length > 0) {
            const historyMessages = [];
            history.forEach((conv, index) => {
              historyMessages.push({
                id: conv._id ? `${conv._id}-user` : `hist-${index}-user`,
                text: conv.userMessage,
                isBot: false,
                timestamp: new Date(conv.timestamp),
              });
              historyMessages.push({
                id: conv._id ? `${conv._id}-bot` : `hist-${index}-bot`,
                text: conv.botMessage,
                isBot: true,
                timestamp: new Date(conv.timestamp),
              });
            });
            setMessages(historyMessages);
          } else {
            setMessages([
              {
                id: "welcome",
                text: getContextWelcomeMessage(),
                isBot: true,
                timestamp: new Date(),
              }
            ]);
          }
        } else {
          setMessages([
            {
              id: "welcome",
              text: getContextWelcomeMessage(),
              isBot: true,
              timestamp: new Date(),
            }
          ]);
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
        if (isMounted) {
          setMessages([
            {
              id: "welcome",
              text: getContextWelcomeMessage(),
              isBot: true,
              timestamp: new Date(),
            }
          ]);
        }
      } finally {
        if (isMounted) {
          setIsHistoryLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [user, isOpen, getContextWelcomeMessage]);

  useEffect(() => {
    if (!inputMessage && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [inputMessage]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
    userHasScrolledUp.current = !isAtBottom;
  };

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

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        text: getContextWelcomeMessage(),
        isBot: true,
        timestamp: new Date(),
      }
    ]);
    setCurrentCategory("general");
    userHasScrolledUp.current = false;
  };

  const handleSendMessage = useCallback(
    async (messageText) => {
      const text = (typeof messageText === "string" ? messageText : inputMessage).trim();
      if (!text || text.length > 1000 || isLoading || requestInFlightRef.current) return;

      requestInFlightRef.current = true;

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

      let botText = "";
      let idToken = null;
      try {
        if (!user) {
          botText = "[**Please sign in**](/auth) to use the AI chatbot.";
        } else {
          // 🛠️ STEP 2 INTERCEPT: Check text signature against local action handlers first!
          const actionResponse = await parseUserIntent(text);
          const parsedResult = JSON.parse(actionResponse);

          if (parsedResult.status === 'success') {
            // Found a registry tool trigger match. Format the raw output nicely for render view
            botText = `🤖 **Action Handler Initiated Successfully**\n\n\`\`\`json\n${JSON.stringify(parsedResult, null, 2)}\n\`\`\``;
          } else {
            // No local action regex matched. Fall through safely to normal processing pipeline
            const idToken = await user.getIdToken();
            botText = await generateBotResponse(text, currentCategory, idToken, [...messages, userMsg]);
          }
          idToken = await user.getIdToken();
          botText = await generateBotResponse(text, currentCategory, idToken, [...messages, userMsg]);
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
      requestInFlightRef.current = false;

      if (idToken) {
        await saveConversation(text, botText, idToken);
      }
    },
    [inputMessage, isLoading, currentCategory, user, messages]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ---------------------------------------------------------------------------
  // Theme tokens
  // ---------------------------------------------------------------------------
  const themeTokens = {
    bg: isDarkMode
      ? "bg-gray-950/90 backdrop-blur-xl text-white"
      : "bg-white/95 backdrop-blur-xl text-gray-900",
    header:
      "bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 border-b border-white/10 shadow-lg shadow-purple-950/20",
    border: isDarkMode ? "border-white/10" : "border-gray-200/80",
    botMsg: isDarkMode
      ? "bg-white/[0.04] text-gray-200 border border-white/5 shadow-[0_4px_24px_rgba(139,92,246,0.15)]"
      : "bg-gray-900/[0.03] text-gray-800 border border-black/5 shadow-[0_4px_20px_rgba(139,92,246,0.06)]",
    userMsg:
      "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-[0_4px_18px_rgba(139,92,246,0.25)] text-white border border-purple-500/10",
    botAvatar: isDarkMode
      ? "bg-purple-800/80 text-purple-300 border border-purple-500/20"
      : "bg-purple-100 text-purple-600 border border-purple-200",
    userAvatar: isDarkMode
      ? "bg-indigo-800/80 text-indigo-300 border border-indigo-500/20"
      : "bg-indigo-100 text-indigo-600 border border-indigo-200",
    input: isDarkMode
      ? "bg-white/[0.03] border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-450 focus:ring-2 focus:ring-purple-400 focus:border-transparent",
    catBtn: isDarkMode ? "hover:bg-white/[0.05] text-gray-300" : "hover:bg-gray-100 text-gray-600",
    catBtnActive: isDarkMode
      ? "bg-purple-800/60 text-purple-200 border border-purple-500/30"
      : "bg-purple-100 text-purple-700 border border-purple-200",
    suggestion: isDarkMode
      ? "bg-purple-950/40 text-purple-300 hover:bg-purple-900/40 border border-purple-800/40 shadow-sm"
      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 shadow-sm",
    loading: isDarkMode ? "bg-white/[0.04] border border-white/5" : "bg-gray-50 border border-black/5",
    dot: isDarkMode ? "text-gray-400" : "text-gray-500",
  };

  if (!isOpen) {
    return (
      <div className={`fixed z-50 transition-all duration-300 right-4 md:right-6 ${isScrolling ? 'bottom-16 opacity-40 scale-90 md:bottom-6 md:opacity-100 md:scale-100' : 'bottom-24 md:bottom-6 opacity-100 scale-100'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 group"
          aria-label="Open Nova chat"
        >
          <MessageCircle size={24} />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            <Sparkles size={14} />
          </span>
          <span className="absolute -left-28 -top-10 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Ask Nova anything!
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-50 flex flex-col ${themeTokens.bg} shadow-2xl transition-all duration-300 border ${themeTokens.border} ${
        isMinimized ? "bottom-24 md:bottom-6 right-4 md:right-6 w-72 h-16 overflow-hidden rounded-xl" : "bottom-0 right-0 w-full h-full rounded-none sm:bottom-6 sm:right-6 sm:w-96 sm:h-[660px] sm:rounded-xl"
      }`}
    >
      {/* Header */}
      <div className={`${themeTokens.header} text-white p-4 rounded-t-xl flex items-center justify-between shrink-0`}>
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
          <button onClick={clearChat} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Clear chat" aria-label="Clear chat">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setTheme(isDarkMode ? "light" : "dark")} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title="Toggle theme" aria-label="Toggle theme">
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-2 rounded-lg transition-colors" title={isMinimized ? "Expand" : "Minimize"} aria-label={isMinimized ? "Expand chat" : "Minimize chat"}>
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 sm:p-2 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Close" aria-label="Close chat">
            <X size={20} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Category Tabs */}
          <div className={`p-2 border-b ${themeTokens.border} shrink-0`}>
            <div className="flex space-x-1 overflow-x-auto scrollbar-none">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCurrentCategory(cat.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                      currentCategory === cat.id ? themeTokens.catBtnActive : themeTokens.catBtn
                    }`}
                  >
                    <IconComponent size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages Stream Container */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 select-text"
          >
            {isHistoryLoading ? (
              <div className="flex flex-col items-center justify-center h-full space-y-2 text-gray-500">
                <RefreshCw size={24} className="animate-spin text-purple-500" />
                <span className="text-xs">Loading conversation history...</span>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start space-x-2.5 ${msg.isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
                    <div className={`p-2 rounded-xl shrink-0 ${msg.isBot ? themeTokens.botAvatar : themeTokens.userAvatar}`}>
                      {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm transition-all duration-200 ${msg.isBot ? themeTokens.botMsg : themeTokens.userMsg}`}>
                      {msg.isBot ? (
                        <ReactMarkdown components={markdownComponents}>{msg.text}</ReactMarkdown>
                      ) : (
                        <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggested Questions Area */}
          <div className={`p-3 border-t ${themeTokens.border} shrink-0 space-y-2`}>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
              {suggestedQuestions[currentCategory]?.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className={`text-left px-2.5 py-1 rounded-lg text-xs transition-all duration-150 cursor-pointer ${themeTokens.suggestion}`}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box Actions */}
            <div className="flex items-end space-x-2 pt-1">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  rows={1}
                  className={`w-full pr-10 pl-3 py-2 rounded-xl text-sm border resize-none focus:outline-none scrollbar-none transition-all duration-200 ${themeTokens.input}`}
                  style={{ minHeight: "38px", maxHeight: "120px" }}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-2.5 rounded-xl hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shadow-md shrink-0"
                ))}

                {isLoading && (
                  <div className="flex items-start space-x-2.5">
                    <div className={`p-2 rounded-xl shrink-0 ${themeTokens.botAvatar}`}>
                      <Bot size={16} />
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${themeTokens.loading}`}>
                      <div className="flex space-x-1 items-center h-4 select-none">
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-100 ${themeTokens.dot}`} style={{ backgroundColor: 'currentColor' }} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-200 ${themeTokens.dot}`} style={{ backgroundColor: 'currentColor' }} />
                        <div className={`w-1.5 h-1.5 rounded-full animate-bounce delay-300 ${themeTokens.dot}`} style={{ backgroundColor: 'currentColor' }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Suggested Questions Pillar Context Chips */}
                {suggestedQuestions[currentCategory] && messages.length <= 1 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-[11px] font-semibold tracking-wider uppercase opacity-60 px-1">Suggested Questions</p>
                    <div className="flex flex-col gap-2">
                      {suggestedQuestions[currentCategory].map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(q)}
                          className={`text-left px-3 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer ${themeTokens.suggestion}`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Form Input Submission Layout Control */}
          <div className={`p-3 border-t ${themeTokens.border} shrink-0 bg-transparent`}>
            <div className="flex items-end space-x-2 relative">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                maxLength={1000}
                aria-label="Type your message to Nova"
                placeholder={isHistoryLoading ? "Loading chat history..." : "Ask Nova a question..."}
                disabled={isHistoryLoading || isLoading}
                className={`flex-1 resize-none overflow-y-auto py-2.5 pl-4 pr-10 rounded-xl text-sm focus:outline-none transition-all duration-150 border max-h-32 ${themeTokens.input}`}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading || isHistoryLoading}
                className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors cursor-pointer"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}