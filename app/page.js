"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import CommentSection from "@/components/CommentSection";
import {
  TrendingUp,
  Award,
  Zap,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  ChevronDown,
  HelpCircle,
  Calendar,
  UserCheck,
  BarChart3,
} from "lucide-react";

// --- Mock Data & Constants ---
const STATS_ITEMS = [
  {
    id: "ring-3",
    number: 99.8,
    suffix: "%",
    label: "Attendance Tracking Accuracy",
    href: "/metrics/attendance",
    icon: ShieldCheck,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    id: "ring-2",
    number: 45,
    suffix: "%",
    label: "Admin Workload Reduction",
    href: "/metrics/efficiency",
    icon: Zap,
    iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20"
  },
  {
    id: "ring-1",
    number: 25,
    suffix: "K+",
    label: "Active Daily Campus Users",
    href: null,
    icon: Users,
    iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20"
  }
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Smart Curriculum Planner",
    description: "Map syllabi, track lesson progressions, and auto-align department goals with a seamless drag-and-drop timeline.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: UserCheck,
    title: "AI Attendance Engine",
    description: "Eliminate manual proxies with smart verification, real-time absence alerts, and comprehensive streak logging.",
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  },
  {
    icon: BarChart3,
    title: "Predictive Insights",
    description: "Identify struggling students early and gauge curriculum velocity with advanced data dashboards.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  }
];

const ROLE_DATA = {
  admins: {
    title: "Centralized Campus Control",
    description: "Manage multiple departments, cross-verify compliance criteria, automate institutional audit reports, and broadcast critical alerts effortlessly.",
    points: ["Multi-branch sync", "Automated compliance audits", "Role-based permission gating"]
  },
  educators: {
    title: "Focus on Teaching, Not Paperwork",
    description: "Log dynamic syllabus milestones in seconds, track student attendance streaks, and automatically flag performance anomalies.",
    points: ["One-click attendance grids", "Dynamic lesson trackers", "Instant parent notifications"]
  },
  students: {
    title: "A Calmer, Connected Journey",
    description: "Stay perfectly aligned with department timelines, track your personal attendance thresholds to avoid penalties, and receive centralized updates.",
    points: ["Real-time threshold alerts", "Syllabus tracking dashboard", "Direct assignment portals"]
  }
};

const FAQ_ITEMS = [
  {
    question: "How does the AI Attendance Engine prevent proxy attendance?",
    answer: "Our AI Attendance Engine integrates intelligent multi-layered verification—including automated anomaly detection and real-time streak monitoring—to validate records effortlessly without manual intervention."
  },
  {
    question: "Can the Smart Curriculum Planner adjust to sudden calendar shifts?",
    answer: "Absolutely. The intuitive drag-and-drop timeline updates dependent curriculum milestones globally, instantly broadcasting the adjusted velocity across your specific department layout."
  },
  {
    question: "Is data synchronized in real-time across multiple branches?",
    answer: "Yes. Learnova features built-in multi-branch syncing. Any institutional directive, audit report update, or compliance adjustment updates across all connected campuses immediately."
  },
  {
    question: "What platform analytics are visible to students?",
    answer: "Students receive dedicated dashboards highlighting active attendance thresholds to bypass credit penalties, upcoming assignment deadlines, and aligned syllabus timelines."
  }
];

// --- High-Fidelity Child Components ---

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SectionBadge({ icon: Icon, text, gradient, borderClass, iconClass, textClass }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-r ${gradient} ${borderClass}`}>
      <Icon className={`w-4 h-4 ${iconClass}`} />
      <span className={`text-xs font-semibold tracking-wide uppercase ${textClass}`}>{text}</span>
    </div>
  );
}

function ActionButton({ children, href }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center justify-center px-6 py-3 rounded-xl bg-black text-white dark:bg-white dark:text-black font-medium transition-all duration-300 hover:opacity-90 shadow-md hover:shadow-lg text-sm"
    >
      {children}
    </Link>
  );
}

// Custom Accordion Item for the FAQ Section
function FAQAccordionItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className="border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-900/20 backdrop-blur-md rounded-2xl overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-5 md:p-6 text-left font-semibold text-black dark:text-zinc-200 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none"
      >
        <span className="text-sm md:text-base leading-relaxed">{question}</span>
        <ChevronDown 
          className={`w-5 h-5 text-purple-500 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 md:px-6 md:pb-6 text-xs md:text-sm text-muted-foreground leading-relaxed border-t border-gray-100 dark:border-white/[0.02] pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnimatedCounter({ to, suffix }) {
  return (
    <span>
      {to}
      {suffix}
    </span>
  );
}

// --- Main Page Component ---
export default function Page() {
  const [hoveredRing, setHoveredRing] = useState(null);
  const [activeRole, setActiveRole] = useState("admins");
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground selection:bg-purple-500/30">
        
        {/* Premium Academic Performance Metrics */}
        <section
          id="stats"
          className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Column: Contextual Messaging */}
              <Reveal className="lg:col-span-5 space-y-6">
                <SectionBadge
                  icon={TrendingUp}
                  text="Institutional Impact"
                  gradient="from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20"
                  borderClass="border-blue-200/50 dark:border-blue-500/30"
                  iconClass="text-blue-500"
                  textClass="text-blue-700 dark:text-blue-300"
                />
                <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white tracking-tight leading-tight">
                  Measurable Academic Operational Efficiency
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Hover over our structural hubs to review platform milestones. We embed robust data layers straight into modern campuses to elevate productivity and engagement metrics.
                </p>
                <div className="pt-4 flex flex-wrap gap-4">
                  <ActionButton href="/case-studies/impact">
                    View Impact Reports
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </ActionButton>
                </div>
              </Reveal>

              {/* Right Column: High-Fidelity Orbital Interactive Diagrams */}
              <Reveal className="lg:col-span-7 flex flex-col md:flex-row items-center justify-center gap-12" delay={0.1}>
                
                {/* Concentric Interactive Rings Diagram Container */}
                <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center bg-black/5 dark:bg-white/[0.02] rounded-full border border-gray-200/50 dark:border-white/5 backdrop-blur-sm shadow-inner">
                  
                  {/* Outer Orbital Layer - Ring 3 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(0)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border-2 border-dashed transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 0 
                        ? "w-[95%] h-[95%] border-purple-500 bg-purple-500/[0.02] scale-105 rotate-45" 
                        : "w-[90%] h-[90%] border-purple-500/20 dark:border-purple-500/10"
                      }`}
                  />

                  {/* Middle Orbital Layer - Ring 2 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(1)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border border-double transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 1 
                        ? "w-[75%] h-[75%] border-blue-400 bg-blue-500/[0.02] -rotate-45" 
                        : "w-[70%] h-[70%] border-blue-500/20 dark:border-blue-500/10"
                      }`}
                  />

                  {/* Inner Orbital Layer - Ring 1 */}
                  <div 
                    onMouseEnter={() => setHoveredRing(2)}
                    onMouseLeave={() => setHoveredRing(null)}
                    className={`absolute rounded-full border transition-all duration-700 cursor-pointer flex items-center justify-center
                      ${hoveredRing === 2 
                        ? "w-[55%] h-[55%] border-emerald-400 bg-emerald-500/[0.02] scale-95" 
                        : "w-[50%] h-[50%] border-emerald-500/20 dark:border-emerald-500/10"
                      }`}
                  />

                  {/* Core Dynamic Focal Node */}
                  <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-xl transition-transform duration-500 hover:scale-110 flex items-center justify-center">
                    <div className="w-full h-full bg-background rounded-full flex flex-col items-center justify-center text-center p-2">
                      <Award className="w-6 h-6 text-purple-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Live</span>
                    </div>
                  </div>
                </div>

                {/* Grid-List Metrics */}
                <div className="flex-1 w-full space-y-4">
                  {STATS_ITEMS.map((stat, idx) => {
                    const isSelected = hoveredRing === idx;
                    const IconComponent = stat.icon;
                    return (
                      <div
                        key={stat.id}
                        onMouseEnter={() => setHoveredRing(idx)}
                        onMouseLeave={() => setHoveredRing(null)}
                        className={`group block p-4 rounded-2xl border transition-all duration-500 cursor-pointer
                          ${isSelected 
                            ? "bg-purple-950/20 border-purple-500/40 translate-x-2 shadow-lg shadow-purple-500/5" 
                            : "bg-white/[0.02] dark:bg-black/20 border-white/5 hover:border-white/10 hover:bg-white/[0.04]"
                          }`}
                      >
                        {stat.href ? (
                          <Link href={stat.href} className="focus:outline-none flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl border ${stat.iconColor} transition-transform duration-300 group-hover:scale-105`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-2xl font-black text-white transition-colors duration-300 group-hover:text-purple-400">
                                <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                              </div>
                              <p className="text-xs font-semibold text-gray-300 mt-0.5 flex items-center gap-1 group-hover:text-white transition-colors">
                                {stat.label}
                                <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-purple-400" />
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl border ${stat.iconColor} transition-transform duration-300 group-hover:scale-105`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="text-2xl font-black text-white">
                                <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                              </div>
                              <p className="text-xs font-semibold text-gray-300 mt-0.5">
                                {stat.label}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </Reveal>
            </div>
          </div>
        </section>

        {/* --- FEATURE GRID --- */}
        <section id="features" className="py-20 bg-gray-50/40 dark:bg-zinc-950/40 border-y border-gray-100 dark:border-white/[0.02]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <SectionBadge
                icon={Zap}
                text="Engineered for Scale"
                gradient="from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20"
                borderClass="border-purple-200/50 dark:border-purple-500/30"
                iconClass="text-purple-500"
                textClass="text-purple-700 dark:text-purple-300"
              />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                Intelligent Frameworks Built for Modern Classrooms
              </h2>
              <p className="text-muted-foreground">
                Simplify complex department operations with an interconnected ecosystem built on cutting-edge design paradigms.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {FEATURES.map((feat, i) => {
                const IconComp = feat.icon;
                return (
                  <Reveal key={i} delay={i * 0.1}>
                    <div className="h-full p-6 bg-white dark:bg-zinc-900/40 border border-gray-200/60 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1">
                      <div>
                        <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                          <IconComp className={`w-6 h-6 ${feat.color}`} />
                        </div>
                        <h3 className="text-lg font-bold text-black dark:text-white mb-2">{feat.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* --- ROLE-BASED TAILORED WORKFLOWS --- */}
        <section id="roles" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <Reveal className="lg:col-span-5 space-y-6">
              <SectionBadge
                icon={GraduationCap}
                text="Tailored Workflows"
                gradient="from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20"
                borderClass="border-emerald-200/50 dark:border-emerald-500/30"
                iconClass="text-emerald-500"
                textClass="text-emerald-700 dark:text-emerald-300"
              />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                One Platform. Optimized Roles.
              </h2>
              <p className="text-muted-foreground">
                Select your perspective to explore how our specialized UI architecture satisfies institutional demands across roles.
              </p>

              {/* Tab Toggles */}
              <div className="flex bg-gray-100 dark:bg-zinc-900/80 p-1.5 rounded-xl border border-gray-200/60 dark:border-white/5 space-x-1">
                <button
                  onClick={() => setActiveRole("admins")}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${activeRole === "admins" ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <div className="flex items-center justify-center gap-1.5"><Users className="w-3.5 h-3.5" /> Admins</div>
                </button>
                <button
                  onClick={() => setActiveRole("educators")}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${activeRole === "educators" ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <div className="flex items-center justify-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Educators</div>
                </button>
                <button
                  onClick={() => setActiveRole("students")}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all ${activeRole === "students" ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <div className="flex items-center justify-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" /> Students</div>
                </button>
              </div>
            </Reveal>

            {/* Dynamic Content Card */}
            <div className="lg:col-span-7">
              <motion.div
                key={activeRole}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="p-8 bg-white dark:bg-zinc-900/30 border border-gray-200/60 dark:border-white/5 rounded-2xl shadow-xl backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <h3 className="text-xl font-bold text-black dark:text-white mb-3">{ROLE_DATA[activeRole].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{ROLE_DATA[activeRole].description}</p>
                <ul className="space-y-3">
                  {ROLE_DATA[activeRole].points.map((pt, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                      <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- NEW SECTION: FAQ ACCORDION --- */}
        <section id="faqs" className="py-20 bg-gray-50/40 dark:bg-zinc-950/40 border-y border-gray-100 dark:border-white/[0.02]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <SectionBadge
                icon={HelpCircle}
                text="Common Queries"
                gradient="from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20"
                borderClass="border-purple-200/50 dark:border-purple-500/30"
                iconClass="text-purple-500"
                textClass="text-purple-700 dark:text-indigo-300"
              />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black dark:text-white">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground text-sm md:text-base">
                Got structural questions about platform functionalities? Look through our documented answers below.
              </p>
            </Reveal>

            <Reveal className="space-y-4" delay={0.1}>
              {FAQ_ITEMS.map((faq, index) => (
                <FAQAccordionItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaqIdx === index}
                  onToggle={() => setOpenFaqIdx(openFaqIdx === index ? null : index)}
                />
              ))}
            </Reveal>
          </div>
        </section>

        {/* Comment Section Block */}
        <section id="comments" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <CommentSection />
          </Reveal>
        </section>
      </div>
    </>
  );
}