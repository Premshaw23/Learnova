"use client";

import {
  Rocket,
  BrainCircuit,
  Globe,
  Sparkles,
  ArrowRight,
  Target,
  GraduationCap,
  Lightbulb,
} from "lucide-react";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

const pillars = [
  {
    title: "Smart Learning",
    description:
      "Empowering students with intelligent tools that simplify learning and improve academic engagement.",
    icon: BrainCircuit,
    glow: "from-fuchsia-500 to-purple-500",
  },
  {
    title: "Global Accessibility",
    description:
      "Making modern educational experiences accessible for every learner regardless of location.",
    icon: Globe,
    glow: "from-cyan-500 to-blue-500",
  },
  {
    title: "Collaborative Growth",
    description:
      "Building an ecosystem where students, educators, and contributors grow together.",
    icon: GraduationCap,
    glow: "from-indigo-500 to-violet-500",
  },
  {
    title: "Future Innovation",
    description:
      "Continuously innovating to redefine how technology enhances education.",
    icon: Sparkles,
    glow: "from-pink-500 to-rose-500",
  },
];

const stats = [
  {
    value: "10K+",
    label: "Students Empowered",
  },
  {
    value: "50+",
    label: "Institutions Connected",
  },
  {
    value: "99.9%",
    label: "Platform Reliability",
  },
  {
    value: "24/7",
    label: "Learning Accessibility",
  },
];

const roadmap = [
  {
    title: "AI-Powered Classrooms",
    description:
      "Integrating intelligent assistance into academic workflows and learning systems.",
  },
  {
    title: "Collaborative Education",
    description:
      "Creating smarter environments where teachers and students learn together seamlessly.",
  },
  {
    title: "Global Learning Access",
    description:
      "Expanding educational accessibility to underserved communities worldwide.",
  },
  {
    title: "Personalized Learning",
    description:
      "Delivering adaptive and personalized educational experiences powered by technology.",
  },
];

export default function MissionPage() {
  return (
    <>
      <Navbar />

      <main
        className="
        relative overflow-hidden min-h-screen
        bg-gradient-to-b
        from-slate-50
        via-white
        to-slate-100
        text-slate-900
        dark:from-[#020617]
        dark:via-[#09090b]
        dark:to-black
        dark:text-white
        transition-colors duration-500
        "
      >
        {/* Ambient Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="absolute top-[30%] left-[10%] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 space-y-32">
          {/* Hero */}
          <section className="text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-5 py-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-200 backdrop-blur-xl">
                <Rocket className="h-4 w-4" />
                Our Mission
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                Empowering{" "}
                <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Education
                </span>
                <br />
                Through Intelligent Technology
              </h1>

              <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Learnova exists to transform education through innovation,
                accessibility, and collaborative technology. We are building a
                future where learning becomes smarter, more connected, and
                accessible to every student and educator.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/values"
                  className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-fuchsia-500/30 hover:bg-white dark:hover:bg-white/10"
                >
                  Explore Our Values
                </Link>
              </div>
            </motion.div>
          </section>

          {/* Mission Pillars */}
          <section className="space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                Our Core Mission
              </h2>

              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                Every product decision and innovation at Learnova is guided by
                these foundational pillars.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="
                    group cursor-pointer rounded-[2rem]
                    border border-slate-200/80
                    dark:border-white/10
                    bg-white/80
                    dark:bg-white/5
                    p-7 backdrop-blur-xl
                    transition-all duration-500
                    hover:-translate-y-3
                    hover:scale-[1.02]
                    hover:border-fuchsia-500/50
                    hover:bg-white
                    dark:hover:border-fuchsia-500/50
                    hover:shadow-[0_20px_80px_rgba(168,85,247,0.18)]
                    dark:hover:shadow-[0_20px_80px_rgba(168,85,247,0.12)]
                    "
                  >
                    <div
                      className={`
                      mb-6 flex h-16 w-16 items-center justify-center rounded-2xl
                      bg-gradient-to-br ${pillar.glow}
                      shadow-lg
                      `}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                      {pillar.title}
                    </h3>

                    <p className="leading-7 text-slate-600 dark:text-slate-300">
                      {pillar.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Stats */}
          <section className="space-y-14">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black tracking-tight">
                Educational Impact
              </h2>

              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                Building tools and systems that improve learning experiences
                across modern educational institutions.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="
                  rounded-[2rem]
                  border border-slate-200/80
                  dark:border-white/10
                  bg-white/80
                  dark:bg-white/5
                  p-8 text-center backdrop-blur-xl
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-cyan-500/50
                  hover:bg-white
                  dark:hover:border-cyan-500/50
                  hover:shadow-[0_0_45px_rgba(34,211,238,0.15)]
                  "
                >
                  <h3 className="text-5xl font-black bg-gradient-to-r from-fuchsia-500 to-cyan-500 dark:from-fuchsia-400 dark:to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </h3>

                  <p className="mt-3 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Vision Timeline */}
          <section className="space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                Future Vision
              </h2>

              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                Learnova is continuously evolving to shape the future of
                education through innovation and collaboration.
              </p>
            </div>

            <div className="relative mx-auto max-w-4xl">
              <div className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-fuchsia-500 via-violet-500 to-cyan-500" />

              <div className="space-y-14">
                {roadmap.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative pl-16"
                  >
                    <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 backdrop-blur-xl">
                      <Target className="h-5 w-5 text-fuchsia-500 dark:text-fuchsia-300" />
                    </div>

                    <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 p-7 backdrop-blur-xl transition-all duration-300 hover:border-fuchsia-500/50 hover:bg-white dark:hover:border-fuchsia-500/50">
                      <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h3>

                      <p className="leading-7 text-slate-600 dark:text-slate-300">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-8 py-20 text-center backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 via-transparent to-cyan-500/20" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                <Lightbulb className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Building the Future of Learning
              </h2>

              <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                Join Learnova in creating intelligent, inclusive, and modern
                educational experiences for students and educators worldwide.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="rounded-full bg-slate-900 dark:bg-white px-7 py-3 text-sm font-semibold text-white dark:text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(255,255,255,0.18)]"
                >
                  Join Learnova
                </Link>

                <Link
                  href="/"
                  className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-7 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:bg-white dark:hover:bg-white/10"
                >
                  Explore Platform
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
