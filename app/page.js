"use client";
import { useTheme } from "next-themes";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import SplitText from "@/components/ui-block/SplitText";
import DarkVeil from "@/components/ui-block/DarkVeil";
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
} from "lucide-react";
import Link from "next/link";
import { analytics } from "@/lib/firebaseConfig";
import { logEvent } from "firebase/analytics";
import LearnovaChatbot from "@/components/ChatBot";

// Constants moved outside component for better performance
const PARTICLES_DATA = [
  { id: 1, left: 20, top: 30, delay: 0, duration: 10 },
  { id: 2, left: 60, top: 80, delay: 2, duration: 12 },
  { id: 3, left: 80, top: 20, delay: 4, duration: 14 },
  { id: 4, left: 30, top: 70, delay: 6, duration: 11 },
  { id: 5, left: 90, top: 50, delay: 8, duration: 13 },
];

const STATS_DATA = [
  { number: "10,000+", label: "Institution Partnerships", icon: BookOpen },
  { number: "5M+", label: "Student Tracking", icon: Users },
  { number: "70%", label: "Time Saved", icon: TrendingUp },
  { number: "98%", label: "Accuracy Rate", icon: Award },
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

// ✅ UPDATED FIXED COMPONENT
const SectionBadge = ({
  icon: Icon,
  text,
  gradient = "from-purple-500/20 to-pink-500/20",
  borderClass = "border-purple-500/30", // 1. Pass the full class name string here
  textColor = "purple-300",
}) => (
  <div
    className={`inline-flex items-center px-4 py-2 bg-gradient-to-r ${gradient} rounded-full border ${borderClass} backdrop-blur-sm mb-6`} // 2. Drop the template literal concatenation
  >
    <Icon className={`w-5 h-5 text-${textColor.split("-")[0]}-400 mr-2`} />
    <span className={`text-${textColor} font-medium`}>{text}</span>
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
      "bg-gradient-to-r from-accent to-purple-500 text-black dark:text-white hover:shadow-xl hover:shadow-accent/25",
    secondary:
      "bg-white/10 text-black dark:text-white border border-white/20 hover:bg-white/20",
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
    <button className={contentClasses}>
      {children}
    </button>
  );
};

export default function AboutPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Memoized mouse tracking with throttling
  const handleMouseMove = useCallback((e) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  const handleAnimationComplete = useCallback(() => {
  }, []);

  useEffect(() => {
    // Throttled event listeners
    let scrollTimeout;
    let mouseTimeout;

    const throttledScroll = () => {
      if (!scrollTimeout) {
        scrollTimeout = setTimeout(() => {
          handleScroll();
          scrollTimeout = null;
        }, 16); // ~60fps
      }
    };

    const throttledMouseMove = (e) => {
      if (!mouseTimeout) {
        mouseTimeout = setTimeout(() => {
          handleMouseMove(e);
          mouseTimeout = null;
        }, 32); // ~30fps
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

  // Memoized style calculations
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

  return (
    <>
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 bg-background">
        {isDark && <DarkVeil />}

        {/* Mouse-following gradient orb */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
          style={mouseOrbStyle}
        />

        {/* Floating particles */}
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
            <SectionBadge icon={Sparkles} text="Introducing Learnova" />

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
    Explore More ↓
  </a>
</div>

        {/* Mission Section */}
        <section
          id="mission"
          className="md:py-20 px-4 sm:px-6 lg:px-8 relative"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <Reveal className="space-y-8">
                <SectionBadge icon={Sparkles} text="Our Mission" />

                <h2 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-accent bg-clip-text text-transparent">
                  Empowering Educational Excellence
                </h2>

                <div className="space-y-6">
                  <p className="md:text-lg text-muted-foreground leading-relaxed">
                    At Learnova, our mission is to harness the power of{" "}
                    <span className="text-accent font-semibold">
                      technology
                    </span>{" "}
                    to make education more efficient, engaging, and equitable.
                    We address the inefficiencies of traditional systems—manual
                    attendance, siloed data, and limited student interaction—by
                    delivering{" "}
                    <span className="text-purple-400 font-semibold">
                      integrated, intuitive solutions
                    </span>
                    .
                  </p>

                  <p className="md:text-lg text-gray-400 leading-relaxed">
                    With Learnova, teachers can teach without distractions,
                    students can learn with purpose, and institutions can create
                    environments where every learner thrives.
                  </p>
                </div>

                <ActionButton href="/activity">
                  Learn More
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </ActionButton>
              </Reveal>

              <Reveal className="relative" delay={0.1}>
                <div className="bg-gradient-to-br from-purple-500/10 via-accent/10 to-pink-500/10 rounded-3xl h-96 flex items-center justify-center border border-purple-500/20 backdrop-blur-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="absolute top-4 right-4 w-3 h-3 bg-accent/60 rounded-full animate-pulse" />
                  <div
                    className="absolute bottom-6 left-6 w-2 h-2 bg-purple-400/60 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />

                  <div className="text-center z-10">
                    <div className="relative mb-6">
                      <GraduationCap className="h-24 w-24 text-black dark:text-white mx-auto group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-700" />
                    </div>
                    <p className="text-xl font-semibold text-black dark:text-white group-hover:text-accent transition-colors duration-500">
                      Transforming Education
                    </p>
                    <p className="text-gray-400 mt-2">
                      One Institution at a Time
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
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
                gradient="from-accent/20 to-purple-500/20"
                borderColor="accent/30"
                textColor="accent"
              />
              

              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Core Principles That Drive Us
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our core values reflect what makes Learnova authentic and
                trustworthy for schools, teachers, parents, and students.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {VALUES_DATA.map((value, index) => (
                <Reveal key={value.title} delay={index * 0.08}>
                  <Card className="group bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-accent/10 hover:border-accent/50 transition-all duration-700 hover:scale-[1.02]">
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
                    <CardContent>
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

        {/* Team Section */}
        <section id="team" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Reveal className="text-center mb-20">
              <SectionBadge
                icon={Users}
                text="Our Team"
                gradient="from-emerald-500/20 to-teal-500/20"
                borderColor="emerald-500/30"
                textColor="emerald-400"
              />

              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Meet the Visionaries
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                The passionate educators and technologists driving Learnova's
                innovation and success.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8">
              {TEAM_MEMBERS.map((member, index) => (
                <Reveal key={member.name} delay={index * 0.08}>
                  <Card className="group bg-white dark:bg-black/40 border-gray-200 dark:border-white/10 backdrop-blur-xl shadow-sm hover:shadow-lg hover:shadow-accent/10 hover:border-accent/50 transition-all duration-700 hover:scale-[1.02]">
                    <CardContent className="pt-8 text-center">
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

        {/* Stats Section */}
        <section
          id="stats"
          className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-purple-500/10 to-pink-500/10 backdrop-blur-3xl">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 70%), radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.2) 0%, transparent 70%)`,
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto relative">
            <Reveal className="text-center mb-20">
              <SectionBadge
                icon={TrendingUp}
                text="Our Impact"
                gradient="from-white/10 to-white/10"
                borderColor="white/20"
                textColor="white"
              />

              <h2 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
                Transforming Education Globally
              </h2>
              <p className="text-xl text-black dark:text-white/80 max-w-3xl mx-auto">
                Measurable results that demonstrate our commitment to
                educational excellence and institutional success.
              </p>
            </Reveal>

            <div className="grid md:grid-cols-4 gap-8">
              {STATS_DATA.map((stat, index) => (
                <Reveal key={stat.label} delay={index * 0.08}>
                  <div className="group text-center">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 hover:border-accent/40 transition-all duration-700 hover:scale-[1.02] hover:shadow-2xl">
                      <stat.icon className="w-12 h-12 text-accent mx-auto mb-6 group-hover:scale-110 transition-transform duration-500" />
                      <div className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-3 group-hover:text-accent transition-colors duration-500">
                        {stat.number}
                      </div>
                      <p className="text-black dark:text-white/80 font-medium text-lg group-hover:text-black dark:text-white transition-colors duration-500">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
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
              <SectionBadge icon={Sparkles} text="Our Impact" />
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
                  <div className="bg-black rounded-3xl p-8 flex flex-col justify-center items-center text-center h-full min-h-[260px] border border-white/10">
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

        {/* CTA Section */}
        <section id="get-started" className="py-20 px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br dark:from-black/50 to-purple-900/30 rounded-3xl p-12 border border-accent/30 backdrop-blur-xl hover:border-accent/50 transition-all duration-700">
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
