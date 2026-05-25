"use client";
import { useTheme } from "next-themes";
import { translations } from "@/constants/translations";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import SplitText from "@/components/ui-block/SplitText";
import DarkVeil from "@/components/ui-block/DarkVeil";
import CommentSection from "@/components/CommentSection";


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Target,
  Heart,
  Lightbulb,
  User,
  Building2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Timer,
  CalendarDays,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";

// Constants moved outside component for better performance
const PARTICLES_DATA = [
  { id: 1, left: 20, top: 30, delay: 0, duration: 10 },
  { id: 2, left: 60, top: 80, delay: 2, duration: 12 },
  { id: 3, left: 80, top: 20, delay: 4, duration: 14 },
  { id: 4, left: 30, top: 70, delay: 6, duration: 11 },
  { id: 5, left: 90, top: 50, delay: 8, duration: 13 },
];

const VALUES_DATA = [
  {
    icon: Target,
    title: "Efficiency",
    description:
      "We streamline workflows and reduce redundancy, giving educators more time to focus on teaching.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Heart,
    title: "Engagement",
    description:
      "Interactive and gamified experiences that motivate students and make learning enjoyable.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: Lightbulb,
    title: "Accessibility",
    description:
      "Designed for all schools, even in low-network areas, with affordable and easy-to-use solutions.",
    gradient: "from-purple-500 to-violet-500",
  },
];

const TEAM_MEMBERS = [
  {
    name: "Prem Shaw",
    role: "Founder & Creator — Team Leader, Full-Stack Developer",
    initials: "PS",
    description:
      "Founder of Learnova. Leads the team and built the platform end-to-end — from architecture and backend services to frontend UX and deployment — ensuring a seamless, scalable learning experience.",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Prashant Bhati",
    role: "Web Developer",
    initials: "PB",
    description:
      "Maintains Learnova’s web pages and implements frontend features to ensure a smooth, responsive user experience.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Polawar Pranav Shirish",
    role: "Frontend Developer",
    initials: "PP",
    description:
      "Designs interactive user interfaces to deliver an engaging and accessible student experience.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    name: "Abir Ghosh",
    role: "Machine Learning Specialist",
    initials: "AG",
    description:
      "Develops ML models and data-driven insights to personalize learning and optimize institutional performance.",
    color: "from-rose-500 to-pink-500",
  },
  {
    name: "Anuj Ram Shrivastava",
    role: "ML & Backend Developer",
    initials: "AR",
    description:
      "Works on backend systems and ML algorithms that power smart recommendations and advanced analytics in Learnova.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    name: "Chandana S",
    role: "Testing & Documentation",
    initials: "CS",
    description:
      "Ensures reliability through rigorous testing and comprehensive documentation for the platform.",
    color: "from-amber-500 to-orange-500",
  },
];

const IMPACT_DATA = [
  {
    icon: User,
    title: "Teachers",
    description:
      "Regain ~1 hour/day, enabling more focus on teaching and mentoring.",
  },
  {
    icon: GraduationCap,
    title: "Students",
    description:
      "Convert ~90+ hours/year from idle time into productive learning.",
  },
  {
    icon: Building2,
    title: "Institutions",
    description:
      "Improve attendance and engagement metrics, enhancing overall efficiency.",
  },
  {
    icon: Users,
    title: "Parents",
    description:
      "Gain transparent insights into their child's attendance and activities, fostering trust.",
  },
];

const SectionBadge = ({
  icon: Icon,
  text,
  gradient = "from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20",
  borderClass = "border-purple-200/50 dark:border-purple-500/30",
  iconClass = "text-purple-600 dark:text-purple-400",
  textClass = "text-purple-700 dark:text-purple-300",
}) => (
  <div
    className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${gradient} rounded-full border ${borderClass} backdrop-blur-sm mb-6`}
  >
    <Icon className={`w-5 h-5 ${iconClass} mr-2`} />
    <span className={`${textClass} font-medium`}>{text}</span>
  </div>
);

const Reveal = ({ children, className = "", delay = 0, y = 28 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const ActionButton = ({
  href,
  variant = "primary",
  children,
  className = "",
}) => {
  const baseClasses =
    "group inline-flex items-center px-8 py-4 rounded-full font-semibold transition-all duration-500 hover:scale-[1.02]";
  const variants = {
    primary:
      "bg-gradient-to-r from-accent to-purple-500 text-white hover:shadow-xl hover:shadow-accent/25",
    secondary:
      "bg-purple-50/50 dark:bg-white/10 text-purple-700 dark:text-white border border-purple-200/60 dark:border-white/20 hover:bg-purple-100/50 dark:hover:bg-white/20",
  };

  const contentClasses = `${baseClasses} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={contentClasses}>
        {children}
      </Link>
    );
  }
  return (
    <button className={`${contentClasses} focus:outline-none focus:ring-2 focus:ring-purple-500`}>
      {children}
    </button>
  );
};

const MockupWindow = ({ children, gradientFrom }) => (
  <div className="relative group p-1 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 hover:border-white/20">
    <div className={`absolute inset-0 bg-gradient-to-tr ${gradientFrom} to-transparent opacity-10 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none`} />
    
    <div className="flex items-center gap-1.5 px-5 py-3.5 border-b border-white/5 bg-black/20">
      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
    </div>

    <div className="p-8 bg-black/40 flex items-center justify-center min-h-[220px]">
      {children}
    </div>
  </div>
);

// High-fidelity counting metrics component
function AnimatedCounter({ from = 0, to, suffix }) {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true, margin: "-100px" });
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.floor(latest).toLocaleString());

  useEffect(() => {
    if (inView) {
      const controls = animate(count, to, {
        duration: 2.2,
        ease: [0.16, 1, 0.3, 1],
      });
      return controls.stop;
    }
  }, [inView, count, to]);

  return (
    <span ref={nodeRef} aria-live="polite">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export default function AboutPage() {
  const { theme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Track active infographic orbital index layer
  const [hoveredRing, setHoveredRing] = useState(null);

  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  const handleAnimationComplete = useCallback(() => {}, []);

  useEffect(() => {
    let scrollTimeout;
    let mouseTimeout;

    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 16);
      }
    };

    const throttledMouseMove = (e) => {
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          handleMouseMove(e);
          mouseTimeout = null;
        }, 32);
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    window.addEventListener("mousemove", throttledMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("mousemove", throttledMouseMove);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (mouseTimeout) clearTimeout(mouseTimeout);
    };
  }, [handleScroll, handleMouseMove]);

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", { page: "about" });
    }
  }, []);

  const mouseOrbStyle = useMemo(
    () => ({
      left: mousePosition.x - 192,
      top: mousePosition.y - 192,
      transition: "all 1.2s ease-out",
    }),
    [mousePosition.x, mousePosition.y]
  );

  const gridTransform = useMemo(
    () => ({
      transform: `translateY(${scrollY * 0.2}px)`,
    }),
    [scrollY]
  );

  const STATS_ITEMS = [
    { id: 0, number: 10000, suffix: "+", label: "Institution Partnerships", href: "/case-studies/partnerships" },
    { id: 1, number: 5, suffix: "M+", label: "Student Tracking", href: "/case-studies/impact" },
    { id: 2, number: 70, suffix: "%", label: "Time Saved" },
    { id: 3, number: 98, suffix: "%", label: "Accuracy Rate" },
  ];

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-background">
        {isDark && <DarkVeil />}

        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          style={mouseOrbStyle}
        />

        <div className="absolute inset-0 overflow-hidden">
          {PARTICLES_DATA.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-accent/20 rounded-full animate-float"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="min-h-screen relative z-50">
        <Navbar />

        {/* Hero Section */}
        <section
          id="hero"
          className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: "50px 50px",
              ...gridTransform,
            }}
          />

          <div className="max-w-4xl mx-auto text-center relative">
            <SectionBadge icon={Sparkles} text={translations[language].welcome} />

            <div className="flex flex-wrap justify-center items-center mb-8 text-center gap-x-6 gap-y-4">
              <SplitText
                text="Transforming"
                className="text-4xl sm:text-5xl md:text-7xl font-bold text-black dark:text-white text-balance"
                delay={0.05}
                duration={0.8}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 100, rotateX: -90 }}
                to={{ opacity: 1, y: 0, rotateX: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                onLetterAnimationComplete={handleAnimationComplete}
              />
              <SplitText
                text="Education"
                className="text-4xl sm:text-5xl md:text-7xl font-bold bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent text-balance"
                delay={0.05}
                duration={0.8}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 100, rotateX: -90 }}
                to={{ opacity: 1, y: 0, rotateX: 0 }}
                threshold={0.1}
                rootMargin="-100px"
                textAlign="center"
                onLetterAnimationComplete={handleAnimationComplete}
              />
            </div>

            <h1 className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-normal">
              The most advanced platform for{" "}
              <span className="text-accent font-semibold">
                curriculum planning
              </span>{" "}
              and{" "}
              <span className="text-purple-400 font-semibold">
                attendance management
              </span>
              , designed for smooth academic management.
            </h1>
          </div>
        </section>
        <div className="mt-8 flex justify-center">
          <a
            href="#mission"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300"
          >
            {translations[language].explore}
          </a>
        </div>

        {/* Mission Section */}
        <section
          id="mission"
          className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="max-w-6xl mx-auto">
            <Reveal className="mb-24 max-w-2xl">
              <SectionBadge icon={Sparkles} text={translations[language].mission} />
              <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-black dark:text-white mt-4 mb-6">
                Empowering Educational Excellence
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                At Learnova, our mission is to harness the power of technology to make education more efficient, engaging, and equitable. We build modern workflows to replace age-old fragmentation.
              </p>
            </Reveal>

            <div className="space-y-32">
              {/* Block 1: Teachers */}
              <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <Reveal className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">01 / Workspace Focus</span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-bold text-black dark:text-white tracking-tight">
                    For Teachers: Teach Without Distractions
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Traditional educational setups trap mentors inside layers of manual administrative tasks and overhead tracking lines. Learnova automates routine administrative operations completely, returning up to 1 hour daily to invest directly back into instructional mentoring.
                  </p>
                </Reveal>
                <Reveal className="lg:col-span-5" delay={0.1}>
                  <MockupWindow gradientFrom="from-purple-500/20">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-32 h-32 rounded-full border border-purple-500/10 animate-ping [animation-duration:4s]" />
                      <div className="absolute w-24 h-24 rounded-full border border-purple-500/20" />
                      <User className="w-16 h-16 text-purple-400/50 group-hover:scale-110 group-hover:text-purple-400 transition-all duration-500 relative z-10" />
                    </div>
                  </MockupWindow>
                </Reveal>
              </div>

              {/* Block 2: Students */}
              <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <Reveal className="lg:col-span-5 lg:order-2 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-accent">02 / Dynamic Training</span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-bold text-black dark:text-white tracking-tight">
                    For Students: Learn With Purpose
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    By structuring access windows and simplifying operational steps, we transform idle overhead slots into engaging learning trajectories. Students benefit from transparent tracking loops and collaborative modules optimized for high engagement rates.
                  </p>
                </Reveal>
                <Reveal className="lg:col-span-7 lg:order-1" delay={0.1}>
                  <MockupWindow gradientFrom="from-accent/20">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-32 h-32 rounded-full border border-accent/10 animate-ping [animation-duration:4s]" />
                      <div className="absolute w-24 h-24 rounded-full border border-accent/20" />
                      <GraduationCap className="w-16 h-16 text-accent/50 group-hover:scale-110 group-hover:text-accent transition-all duration-500 relative z-10" />
                    </div>
                  </MockupWindow>
                </Reveal>
              </div>

              {/* Block 3: Institutions */}
              <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                <Reveal className="lg:col-span-7 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">03 / Centralized System</span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-bold text-black dark:text-white tracking-tight">
                    For Institutions: Thrive via Connected Insights
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                    Say goodbye to siloed dashboards and broken communication channels. Our system structures an environment where unified insights deliver deep transparency, protecting data accurately across every department level.
                  </p>
                </Reveal>
                <Reveal className="lg:col-span-5" delay={0.1}>
                  <MockupWindow gradientFrom="from-emerald-500/20">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-32 h-32 rounded-full border border-emerald-500/10 animate-ping [animation-duration:4s]" />
                      <div className="absolute w-24 h-24 rounded-full border border-emerald-500/20" />
                      <Building2 className="w-16 h-16 text-emerald-400/50 group-hover:scale-110 group-hover:text-emerald-400 transition-all duration-500 relative z-10" />
                    </div>
                  </MockupWindow>
                </Reveal>
              </div>
            </div>

            <Reveal className="mt-24 pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <p className="text-sm text-muted-foreground max-w-sm text-center sm:text-left">
                Ready to review our technical system features? Jump directly into the activity center.
              </p>
              <ActionButton href="/activity">
                Explore Platform Features
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </ActionButton>
            </Reveal>
          </div>
        </section>

        {/* Values Section */}
        <section
          id="values"
          className="py-20 px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-purple-900/5 to-black/40 backdrop-blur-3xl" />

          <div className="max-w-7xl mx-auto relative">
            <Reveal className="text-center mb-20">
              <SectionBadge
                icon={Heart}
                text="Our Values"
                gradient="from-accent/10 to-purple-500/10 dark:from-accent/20 dark:to-purple-500/20"
                borderClass="border-accent/20 dark:border-accent/30"
                iconClass="text-accent dark:text-purple-400"
                textClass="text-accent dark:text-purple-300"
              />

              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Core Principles That Drive Us
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our core values reflect what makes Learnova authentic and
                trustworthy for schools, teachers, parents, and students.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8 items-stretch auto-rows-fr">
              {VALUES_DATA.map((value, index) => (
                <Reveal key={value.title} delay={index * 0.08}>
                  <Card className="group h-full flex flex-col bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-accent/10 hover:border-accent/50 transition-all duration-700 hover:scale-[1.02]">
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`mx-auto w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 relative overflow-hidden`}
                      >
                        <value.icon className="h-10 w-10 text-white relative z-10" />
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <CardTitle className="text-gray-950 dark:text-white text-xl group-hover:text-gray-950 dark:group-hover:text-accent transition-colors duration-500">
                        {value.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-grow">
                      <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-500">
                        {value.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Productivity Section */}
        <section
          id="productivity"
          className="py-20 px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-purple-500/10 to-pink-500/10 blur-3xl" />
          <div className="max-w-7xl mx-auto relative">
            <Reveal className="text-center mb-16">
              <SectionBadge
                icon={Sparkles}
                text="Productivity Studio"
                gradient="from-blue-500/20 to-purple-500/20"
                borderClass="border-blue-500/30"
                textClass="text-blue-300"
              />
              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Focus Tools Built for Modern Classrooms
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Plan the day, stay on schedule, and protect deep work sessions with a
                productivity hub designed to match Learnova's smart workflow.
              </p>
            </Reveal>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {[
                {
                  title: "Pomodoro Flow",
                  description:
                    "Guided focus cycles with adaptive breaks, gentle timers, and streak tracking.",
                  icon: Timer,
                  gradient: "from-blue-500/20 to-cyan-500/20",
                },
                {
                  title: "Calendar Pulse",
                  description:
                    "A clean month view with highlighted priorities and built-in agenda cues.",
                  icon: CalendarDays,
                  gradient: "from-purple-500/20 to-pink-500/20",
                },
                {
                  title: "Task Orbit",
                  description:
                    "Create, sort, and complete tasks with quick status updates and reminders.",
                  icon: ListTodo,
                  gradient: "from-emerald-500/20 to-teal-500/20",
                },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <Card className="group bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-xl hover:shadow-accent/10 hover:border-accent/40 transition-all duration-700 hover:scale-[1.02]">
                    <CardHeader className="text-center pb-4">
                      <div
                        className={`mx-auto w-20 h-20 ${item.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500`}
                      >
                        <item.icon className="h-10 w-10 text-accent" />
                      </div>
                      <CardTitle className="text-gray-950 dark:text-white text-xl">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>

            <Reveal className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <ActionButton href="/productivity">
                Explore Productivity Hub
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </ActionButton>
              <ActionButton href="/contact" variant="secondary">
                Request a Workflow Demo
              </ActionButton>
            </Reveal>
          </div>
        </section>

        {/* Team Section */}
        <section id="team" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <SectionBadge
                icon={Users}
                text="Our Team"
                gradient="from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20"
                borderClass="border-emerald-500/20 dark:border-emerald-500/30"
                iconClass="text-emerald-600 dark:text-emerald-400"
                textClass="text-emerald-700 dark:text-emerald-300"
              />

              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Meet the Visionaries
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The passionate educators and technologists driving Learnova's
                innovation and success.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8 auto-rows-fr">
              {TEAM_MEMBERS.map((member, index) => (
                <Reveal key={member.name} delay={index * 0.08}>
                  <Card className="group h-full flex flex-col bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-accent/10 hover:border-accent/50 transition-all duration-700 hover:scale-[1.02]">
                    <CardContent className="pt-8 text-center flex flex-col flex-grow">
                      <div className="relative mb-6">
                        <div
                          className={`w-28 h-28 bg-gradient-to-br ${member.color} rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-500 relative overflow-hidden`}
                        >
                          <span className="text-3xl font-bold text-white relative z-10">
                            {member.initials}
                          </span>
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100">
                          <Sparkles className="w-4 h-4 text-black dark:text-white" />
                        </div>
                      </div>

                      <h3 className="text-2xl font-semibold text-gray-950 dark:text-white mb-2 group-hover:text-gray-950 dark:group-hover:text-accent transition-colors duration-500">
                        {member.name}
                      </h3>
                      <p className="text-accent font-medium mb-4 text-lg">
                        {member.role}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-500">
                        {member.description}
                      </p>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Premium Infographic Concentric Rings Stats Section */}
        <section
          id="stats"
          className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto relative">
            <div className="grid lg:grid-cols-12 gap-16 items-center">
              
              {/* Left Side Static Content Blocks */}
              <div className="lg:col-span-5 flex flex-col items-start">
                <SectionBadge
                  icon={TrendingUp}
                  text={translations[language].impact}
                  gradient="from-purple-500/10 to-pink-500/10"
                  borderClass="border-purple-500/20"
                  iconClass="text-purple-400"
                  textClass="text-purple-400"
                />

                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-black dark:text-white mb-6">
                  Transforming Education Globally
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                  Hover over our verification categories to examine how specific metrics map live into Learnova's global data orbit layers.
                </p>

                {/* Vertical Interlocking Row Anchors */}
                <div className="w-full space-y-4">
                  {STATS_ITEMS.map((stat) => {
                    const isClickable = !!stat.href;
                    const ItemWrapper = isClickable ? Link : "div";

                    return (
                      <ItemWrapper
                        key={stat.id}
                        href={stat.href || null}
                        onMouseEnter={() => setHoveredRing(stat.id)}
                        onMouseLeave={() => setHoveredRing(null)}
                        className={`block p-5 border rounded-2xl transition-all duration-500 ${
                          hoveredRing === stat.id 
                            ? "border-purple-500/40 bg-purple-500/5 -translate-x-1" 
                            : "border-zinc-200 dark:border-white/5 bg-transparent"
                        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-2xl font-black text-black dark:text-white transition-colors duration-300 group-hover:text-purple-400">
                              <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                            </div>
                            <p className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">{stat.label}</p>
                          </div>
                          {isClickable && (
                            <ArrowRight className={`w-4 h-4 text-purple-400 transition-transform duration-500 ${
                              hoveredRing === stat.id ? "translate-x-1" : ""
                            }`} />
                          )}
                        </div>
                      </ItemWrapper>
                    );
                  })}
                </div>
              </div>

              {/* Right Side Complex Interlocking Orbital Rings Showcase */}
              <div className="lg:col-span-7 flex items-center justify-center min-h-[450px] md:min-h-[550px] relative pointer-events-none">
                <div className="relative w-[380px] h-[380px] md:w-[480px] md:h-[480px] flex items-center justify-center">
                  
                  {/* Central Glow Core */}
                  <div className="absolute w-12 h-12 bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-xl animate-pulse" />
                  <div className="absolute w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-[0_0_20px_rgba(168,85,247,0.8)]" />

                  {/* Ring Layer 0: Institution Partnerships */}
                  <div 
                    className={`absolute rounded-full border transition-all duration-700 w-[140px] h-[140px] md:w-[180px] md:h-[180px] ${
                      hoveredRing === 0 
                        ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/5 animate-[spin_20s_linear_infinite]" 
                        : "border-zinc-200/40 dark:border-white/5 animate-[spin_40s_linear_infinite]"
                    }`}
                  >
                    <div className={`absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-colors duration-500 ${
                      hoveredRing === 0 ? "bg-purple-400 shadow-[0_0_10px_#a855f7]" : "bg-zinc-400 dark:bg-zinc-700"
                    }`} />
                  </div>

                  {/* Ring Layer 1: Student Tracking */}
                  <div 
                    className={`absolute rounded-full border transition-all duration-700 w-[210px] h-[210px] md:w-[270px] md:h-[270px] ${
                      hoveredRing === 1 
                        ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/5 animate-[spin_15s_linear_infinite_reverse]" 
                        : "border-zinc-200/40 dark:border-white/5 animate-[spin_35s_linear_infinite_reverse]"
                    }`}
                  >
                    <div className={`absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 rounded-full transition-colors duration-500 ${
                      hoveredRing === 1 ? "bg-purple-400 shadow-[0_0_10px_#a855f7]" : "bg-zinc-400 dark:bg-zinc-700"
                    }`} />
                  </div>

                  {/* Ring Layer 2: Time Saved */}
                  <div 
                    className={`absolute rounded-full border transition-all duration-700 w-[280px] h-[280px] md:w-[360px] md:h-[360px] ${
                      hoveredRing === 2 
                        ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/5 animate-[spin_25s_linear_infinite]" 
                        : "border-zinc-200/40 dark:border-white/5 animate-[spin_45s_linear_infinite]"
                    }`}
                  >
                    <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full transition-colors duration-500 ${
                      hoveredRing === 2 ? "bg-purple-400 shadow-[0_0_10px_#a855f7]" : "bg-zinc-400 dark:bg-zinc-700"
                    }`} />
                  </div>

                  {/* Ring Layer 3: Accuracy Rate */}
                  <div 
                    className={`absolute rounded-full border transition-all duration-700 w-[350px] h-[350px] md:w-[450px] md:h-[450px] ${
                      hoveredRing === 3 
                        ? "border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/5 animate-[spin_18s_linear_infinite_reverse]" 
                        : "border-zinc-200/40 dark:border-white/5 animate-[spin_50s_linear_infinite_reverse]"
                    }`}
                  >
                    <div className={`absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 rounded-full transition-colors duration-500 ${
                      hoveredRing === 3 ? "bg-purple-400 shadow-[0_0_10px_#a855f7]" : "bg-zinc-400 dark:bg-zinc-700"
                    }`} />
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Impact Section */}
        <section
          id="impact"
          className="py-20 px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="max-w-7xl mx-auto relative">
            <Reveal className="text-center mb-16">
              <SectionBadge icon={Sparkles} text={translations[language].impact} />
              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Transforming Education for Everyone
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Learnova empowers teachers, students, institutions, and parents
                with meaningful outcomes.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
              {IMPACT_DATA.map((impact, index) => (
                <Reveal key={impact.title} delay={index * 0.08}>
                  <div className="bg-white dark:bg-black rounded-3xl p-8 flex flex-col justify-center items-center text-center h-full min-h-[260px] border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none hover:border-accent/50 transition-all duration-700 hover:scale-[1.02] group">
                    <impact.icon className="w-12 h-12 text-accent mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-xl font-semibold text-black dark:text-white mb-3 group-hover:text-accent transition-colors duration-500">
                      {impact.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-sm group-hover:text-foreground transition-colors duration-500">
                      {impact.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>


        {/* Community Feedback Section */}
<section className="mx-auto mt-20 max-w-4xl px-6 py-12">
  <div className="mb-8 text-center">
    <h2 className="text-3xl font-bold text-black dark:text-white">
      Community Feedback
    </h2>

    <p className="mt-3 text-slate-500 dark:text-slate-400">
      Share your thoughts, feedback, and ideas about Learnova.
    </p>
  </div>

  <div className="rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-6 shadow-sm dark:shadow-2xl">
    <CommentSection noticeId="homepage" />
  </div>
</section>

        {/* CTA Section */}
        <section id="get-started" className="py-20 px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-black/50 dark:to-purple-900/30 rounded-3xl p-12 border border-purple-200/50 dark:border-accent/30 backdrop-blur-xl hover:border-accent/50 transition-all duration-700">
              <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-6">
                Ready to Transform Your Institution?
              </h2>
              <p className=" text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join hundreds of educational institutions that trust Learnova to
                streamline their administrative processes and improve student
                outcomes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ActionButton href="/auth?mode=signup">
                  Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </ActionButton>
                <ActionButton href="/contact" variant="secondary">
                  Schedule Demo
                </ActionButton>
              </div>
            </div>
          </Reveal>
        </section>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-15px) rotate(90deg);
            opacity: 0.8;
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
