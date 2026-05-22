"use client"
import React, { useState, useRef, useEffect } from "react";
import { CONTACT_INFO } from '../constants/contact'; // Note: Adjust path if needed

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
  Settings,
  RefreshCw,
  BookOpen,
  Users,
  Shield,
  BarChart3,
  Bell,
  Zap,
  Award,
  Clock,
  MapPin,
  QrCode,
  Eye,
  Database,
  Smartphone,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

const LearnovaChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Nova, your AI assistant for Learnova - the Smart Student Engagement Ecosystem! I can help you with attendance management, smart activities, security features, analytics, and more. What would you like to know?",
      isBot: true,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("general");

  const messagesEndRef = useRef(null);

  // Enhanced knowledge base with your platform features
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

  // Enhanced suggested questions by category
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
      "What security measures prevent attendance fraud?",
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

  const contactInfo = {
    email: "shawprem217@gmail.com",
    phone: CONTACT_INFO.phone,
    website: "https://learnova-web.vercel.app",
    demo: "https://learnova-web.vercel.app/contact",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const generateBotResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Greeting responses
    if (
      lowerMessage.includes("hello") ||
      lowerMessage.includes("hi") ||
      lowerMessage.includes("hey")
    ) {
      return "Hello! Welcome to Learnova - your Smart Student Engagement Ecosystem! I'm Nova, and I'm here to help you understand our platform's features:\n\n🎯 **Attendance Automation** - GPS + Time + Optional QR validation\n📚 **Smart Activities** - Turn idle hours into learning hours\n🔒 **Advanced Security** - Multi-factor authentication & encryption\n📊 **Analytics Dashboard** - Real-time insights for all stakeholders\n\nWhat aspect would you like to explore first?";
    }

    // Attendance-related queries
    if (
      lowerMessage.includes("attendance") ||
      lowerMessage.includes("marking") ||
      lowerMessage.includes("present")
    ) {
      return `📋 **Learnova Attendance System**\n\n**Key Features:**\n${learnovaKnowledge.attendance.features
        .map((feature) => `• ${feature}`)
        .join("\n")}\n\n**Benefits:**\n• ${learnovaKnowledge.attendance.benefits
        }\n• Works offline with auto-sync\n• Exception handling with teacher approval\n• Real-time transparency for parents\n\n**How it works:**\nPhone Verified → GPS + Time Check → Optional QR Scan → Offline Storage → Server Sync → Final Status\n\nWant to know more about any specific aspect?`;
    }

    // Security queries
    if (
      lowerMessage.includes("security") ||
      lowerMessage.includes("privacy") ||
      lowerMessage.includes("safe") ||
      lowerMessage.includes("protection")
    ) {
      return `🔒 **Security & Privacy Features**\n\n**Advanced Security:**\n${learnovaKnowledge.security.features
        .map((feature) => `• ${feature}`)
        .join("\n")}\n\n**Privacy Protection:**\n• ${learnovaKnowledge.security.privacy
        }\n• Anonymous analytics options\n• Right to data deletion\n• Secure data export/import\n\n**Compliance:** GDPR, FERPA, SOC 2, ISO 27001\n\nYour data security is our top priority. Need details about any specific security measure?`;
    }

    // Activities and engagement
    if (
      lowerMessage.includes("activity") ||
      lowerMessage.includes("quiz") ||
      lowerMessage.includes("game") ||
      lowerMessage.includes("learning")
    ) {
      return `🎮 **Smart Activity Hub**\n\n**Activity Types:**\n${learnovaKnowledge.activities.types
        .map((type) => `• ${type}`)
        .join(
          "\n"
        )}\n\n**AI Personalization:**\n• Career goal mapping\n• Skill-based recommendations\n• Adaptive difficulty levels\n• Progress-based suggestions\n\n**Gamification:**\n• Badges and achievement systems\n• Class-wide leaderboards\n• Streak maintenance\n• Peer challenges\n\n**Impact:** ${learnovaKnowledge.activities.impact
        }\n\nInterested in trying our demo activities?`;
    }

    // Analytics and dashboards
    if (
      lowerMessage.includes("dashboard") ||
      lowerMessage.includes("analytics") ||
      lowerMessage.includes("report") ||
      lowerMessage.includes("insight")
    ) {
      return `📊 **Analytics & Dashboards**\n\n**Available Dashboards:**\n${learnovaKnowledge.analytics.dashboards
        .map((dash) => `• ${dash}`)
        .join(
          "\n"
        )}\n\n**Key Metrics:**\n• Attendance patterns and trends\n• Activity engagement rates\n• Learning progress tracking\n• Time utilization analysis\n• Performance predictions\n\n**Export Options:**\n• CSV, PDF, Excel formats\n• Scheduled automated reports\n• Custom report builder\n• API integrations\n\nWhich dashboard would you like to learn more about?`;
    }

    // Technical specifications
    if (
      lowerMessage.includes("technical") ||
      lowerMessage.includes("technology") ||
      lowerMessage.includes("stack") ||
      lowerMessage.includes("api")
    ) {
      return `⚙️ **Technical Specifications**\n\n**Frontend:** ${learnovaKnowledge.technology.frontend}\n**Backend:** ${learnovaKnowledge.technology.backend}\n**AI Engine:** ${learnovaKnowledge.technology.ai}\n**Security:** ${learnovaKnowledge.technology.security}\n**Deployment:** ${learnovaKnowledge.technology.deployment}\n\n**Key Technical Features:**\n• Progressive Web App (PWA)\n• Offline-first architecture\n• Cross-platform compatibility\n• Real-time synchronization\n• Scalable microservices\n• RESTful APIs with GraphQL\n\nNeed more details about any specific technology component?`;
    }

    // Pricing and plans
    if (
      lowerMessage.includes("price") ||
      lowerMessage.includes("cost") ||
      lowerMessage.includes("plan") ||
      lowerMessage.includes("subscription")
    ) {
      return `💰 **Learnova Pricing Plans**\n\n🆓 **Free Tier (Trial)**\n• Up to 50 students\n• Basic attendance tracking\n• Limited smart activities\n• Standard support\n\n🏫 **Institution Plan**\n• Unlimited students\n• Full feature access\n• Advanced analytics\n• Priority support\n• Custom integrations\n• Training included\n\n🏢 **Enterprise**\n• Multi-campus support\n• White-label options\n• Dedicated support team\n• Custom development\n• SLA guarantees\n\n**Contact our team for personalized pricing based on your institution size and requirements!**`;
    }

    // Implementation and setup
    if (
      lowerMessage.includes("setup") ||
      lowerMessage.includes("implement") ||
      lowerMessage.includes("install") ||
      lowerMessage.includes("start")
    ) {
      return `🚀 **Getting Started with Learnova**\n\n**Quick Setup Process:**\n1️⃣ **Institution Registration** - Provide basic details\n2️⃣ **System Configuration** - Customize settings\n3️⃣ **User Import** - Bulk upload student/teacher data\n4️⃣ **Training Sessions** - Staff onboarding workshops\n5️⃣ **Pilot Testing** - Start with selected classes\n6️⃣ **Full Deployment** - Institution-wide rollout\n\n**Implementation Support:**\n• Dedicated onboarding manager\n• Technical training sessions\n• 24/7 support during transition\n• Data migration assistance\n• Custom integration support\n\n**Timeline:** Typically 2-4 weeks from signup to full deployment\n\nReady to schedule a demo?`;
    }

    // Support and contact
    if (
      lowerMessage.includes("support") ||
      lowerMessage.includes("help") ||
      lowerMessage.includes("contact") ||
      lowerMessage.includes("demo")
    ) {
      return `🛟 **Support & Contact Information**\n\n📧 **Email:** ${contactInfo.email}\n📞 **Phone:** ${contactInfo.phone}\n🌐 **Website:** ${contactInfo.website}\n🎯 **Live Demo:** ${contactInfo.demo}\n\n**Support Options:**\n• 24/7 AI chatbot assistance\n• Live chat with technical team\n• Video call support sessions\n• Comprehensive documentation\n• Community forums\n• Training workshops\n\n**Response Times:**\n• General inquiries: Within 4 hours\n• Technical issues: Within 2 hours\n• Urgent/Critical: Within 30 minutes\n\nHow can I connect you with the right support channel?`;
    }

    // AI integration via server-side Groq route
    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const content = payload?.data?.message;
        if (content) {
          return content;
        }
      } else {
        console.warn("Groq API route error:", payload);
      }
    } catch (err) {
      console.error("Groq API route error:", err);
      // Fall through to built-in responses
    }

    // Enhanced fallback responses
    const fallbackResponses = [
      `That's a great question! While I focus on Learnova's core features like attendance automation, smart activities, and analytics, our expert team can provide detailed answers for specific technical questions.\n\n📧 **Email:** ${contactInfo.email}\n📞 **Phone:** ${contactInfo.phone}\n🎯 **Schedule Demo:** ${contactInfo.demo}\n\nMeanwhile, is there anything about our Smart Student Engagement Ecosystem I can help explain?`,

      `I'd be happy to help with that! As Learnova's AI assistant, I specialize in our platform's attendance management, security features, and student engagement tools. For specialized inquiries, our technical team is always ready to assist.\n\n🛟 **Quick Support Options:**\n• Live chat on our website\n• Technical documentation hub\n• Video call consultations\n• Community forums\n\nWhat aspect of Learnova would you like to explore?`,

      `Interesting question! While I'm designed to help with Learnova's Smart Student Engagement features, our comprehensive support team can address any specific needs you might have.\n\n🚀 **Let's Get You Connected:**\n• Book a personalized demo\n• Schedule a technical consultation\n• Join our next webinar\n• Access our knowledge base\n\nIn the meantime, would you like to know more about how Learnova transforms traditional education management?`,
    ];

    return fallbackResponses[
      Math.floor(Math.random() * fallbackResponses.length)
    ];
  };

  // Custom components for different themes
  const markdownComponents = {
    strong: ({ children }) => (
      <span
        className={`font-bold text-sm ${isDarkMode ? "text-purple-400" : "text-purple-600"
          }`}
      >
        {children}
      </span>
    ),

    em: ({ children }) => (
      <span
        className={`italic text-sm ${isDarkMode ? "text-blue-400" : "text-blue-600"
          }`}
      >
        {children}
      </span>
    ),

    ul: ({ children }) => (
      <ul className="list-none space-y-1 my-2">{children}</ul>
    ),

    li: ({ children }) => (
      <li className="flex items-start">
        <span
          className={`mr-2 text-xs ${isDarkMode ? "text-purple-400" : "text-purple-600"
            }`}
        >
          •
        </span>
        <span>{children}</span>
      </li>
    ),

    p: ({ children }) => <p className="my-2 text-xs last:mb-0">{children}</p>,

    code: ({ children }) => (
      <code
        className={`px-1 py-0.5 rounded text-xs ${isDarkMode
          ? "bg-gray-700 text-yellow-300"
          : "bg-gray-200 text-red-600"
          }`}
      >
        {children}
      </code>
    ),
  };

  // Add this function in your component
  const saveToMongoDB = async (userMessage, botMessage) => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userMessage: userMessage.text,
          botMessage: botMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save conversation");
      }

      const result = await response.json();
      // console.log("✅ Saved to MongoDB:", result);
    } catch (error) {
      console.error("❌ MongoDB Save Error:", error);
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now() + Math.random(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    let botResponse = "";
    try {
      botResponse = await generateBotResponse(messageText);
    } catch (error) {
      console.error("Error generating response:", error);
      botResponse = `I apologize for the technical difficulty. Our team is here to help you directly:\n\n📧 **Email:** ${contactInfo.email}\n📞 **Phone:** ${contactInfo.phone}\n🎯 **Live Demo:** ${contactInfo.demo}\n\nI can still help with basic questions about Learnova's features!`;
    }

    const botMessage = {
      id: Date.now() + Math.random() + 1,
      text: botResponse,
      isBot: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);

    // 🔥 ADD THIS LINE - Save to MongoDB
    await saveToMongoDB(userMessage, botMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && inputMessage.trim()) {
        handleSendMessage();
      }
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm Nova, your AI assistant for Learnova - the Smart Student Engagement Ecosystem! I can help you with attendance management, smart activities, security features, analytics, and more. What would you like to know?",
        isBot: true,
        timestamp: new Date(),
      },
    ]);
    setCurrentCategory("general");
  };

  const categories = [
    { id: "general", label: "General", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: Clock },
    { id: "activities", label: "Activities", icon: Zap },
    { id: "security", label: "Security", icon: Shield },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const themeClasses = {
    container: isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
    header: isDarkMode
      ? "bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700"
      : "bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600",
    message: {
      bot: isDarkMode
        ? "bg-gray-800 text-gray-200 border border-gray-700"
        : "bg-gray-50 text-gray-800 border border-gray-200",
      user: "bg-gradient-to-r from-purple-600 to-blue-600 text-white",
      avatar: {
        bot: isDarkMode
          ? "bg-purple-800 text-purple-300"
          : "bg-purple-100 text-purple-600",
        user: isDarkMode
          ? "bg-blue-800 text-blue-300"
          : "bg-blue-100 text-blue-600",
      },
    },
    input: isDarkMode
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    suggestion: isDarkMode
      ? "bg-purple-900/50 text-purple-300 hover:bg-purple-800/60 border border-purple-800"
      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200",
    loading: isDarkMode ? "bg-gray-800" : "bg-gray-100",
    categoryButton: isDarkMode
      ? "hover:bg-gray-700 text-gray-300"
      : "hover:bg-gray-100 text-gray-600",
    categoryButtonActive: isDarkMode
      ? "bg-purple-800 text-purple-200"
      : "bg-purple-100 text-purple-700",
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 relative group"
        >
          <MessageCircle size={24} />
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            <Sparkles size={14} />
          </div>
          <div className="absolute -left-24 -top-10 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask Nova anything!
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 sm:right-6 sm:mx-0 mx-auto z-50 ${themeClasses.container
        } rounded-xl shadow-2xl transition-all duration-300 ${isMinimized ? "w-72 h-16" : "w-96 h-[660px]"
        } border ${themeClasses.border}`}
    >
      {/* Enhanced Header */}
      <div
        className={`${themeClasses.header} text-white p-4 rounded-t-xl flex items-center justify-between`}
      >
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="text-yellow-300" size={22} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Nova AI</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              <Sparkles size={10} />
              Learnova Assistant
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearChat}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={toggleTheme}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Category Tabs */}
          <div className={`p-2 border-b ${themeClasses.border} bg-opacity-50`}>
            <div className="flex space-x-1 overflow-x-auto scrollbar-none">
              {categories.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentCategory(id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap ${currentCategory === id
                    ? themeClasses.categoryButtonActive
                    : themeClasses.categoryButton
                    }`}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 h-96 overflow-y-auto space-y-4 scrollbar-none">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? "justify-start" : "justify-end"
                  }`}
              >
                <div
                  className={`flex max-w-sm lg:max-w-md ${message.isBot ? "flex-row" : "flex-row-reverse"
                    } items-end space-x-2`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot
                      ? themeClasses.message.avatar.bot
                      : themeClasses.message.avatar.user
                      }`}
                  >
                    {message.isBot ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${message.isBot
                      ? themeClasses.message.bot
                      : themeClasses.message.user
                      }`}
                  >
                    {message.isBot ? (
                      // Use in your ReactMarkdown
                      <ReactMarkdown
                        components={markdownComponents}
                      >
                        {message.text}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.text}
                      </p>
                    )}
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Enhanced Suggested Questions */}
            {messages.length === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p
                    className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                  >
                    💡 Popular questions about{" "}
                    {categories.find((c) => c.id === currentCategory)?.label}:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestedQuestions[currentCategory]?.map(
                      (question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(question)}
                          className={`text-xs px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.02] text-left ${themeClasses.suggestion}`}
                        >
                          {question}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start mb-4">
                <div
                  className={`${themeClasses.loading} rounded-2xl p-4 shadow-sm`}
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span
                      className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                    >
                      Nova is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Contact Info */}
          <div className={`px-4 py-2 border-t ${themeClasses.border}`}>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <a
                href={`mailto:${contactInfo.email}`}
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-blue-400" : "text-blue-600"
                  }`}
              >
                <Mail size={12} />
                <span>Email Support</span>
              </a>
              <a
                href={`tel:${contactInfo.phone}`}
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-green-400" : "text-green-600"
                  }`}
              >
                <Phone size={12} />
                <span>Call Us</span>
              </a>
              <a
                href={contactInfo.demo}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-1 hover:underline ${isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
              >
                <ExternalLink size={12} />
                <span>Live Demo</span>
              </a>
            </div>
          </div>

          {/* Input */}
          <div className={`p-4 border-t ${themeClasses.border}`}>
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Ask Nova about Learnova..."
                  className={`w-full px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${themeClasses.input}`}
                  rows="1"
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  style={{
                    minHeight: "48px",
                    maxHeight: "120px",
                  }}
                />
              </div>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className="flex items-center space-x-2">
                {hasApiKey && (
                  <div className="flex items-center space-x-1 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span
                      className={`${isDarkMode ? "text-green-400" : "text-green-600"
                        }`}
                    >
                      AI Enhanced
                    </span>
                  </div>
                )}
                <p
                  className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                >
                  Powered by Nova AI
                </p>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                <div
                  className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LearnovaChatbot;
