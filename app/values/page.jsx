"use client";

import {
  HeartHandshake,
  ShieldCheck,
  Users,
  Accessibility,
  Lightbulb,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

const values = [
  {
    title: "Student First",
    description:
      "Every feature and innovation is designed around improving the student learning experience.",
    icon: HeartHandshake,
    glow: "from-pink-500 to-rose-500",
  },
  {
    title: "Accessibility",
    description:
      "Education should be accessible, inclusive, and available to everyone regardless of limitations.",
    icon: Accessibility,
    glow: "from-cyan-500 to-blue-500",
  },
  {
    title: "Open Collaboration",
    description:
      "We believe innovation grows faster when contributors, students, and educators collaborate openly.",
    icon: Users,
    glow: "from-indigo-500 to-violet-500",
  },
  {
    title: "Transparency",
    description:
      "Clear communication, trust, and openness are at the center of everything we build.",
    icon: ShieldCheck,
    glow: "from-emerald-500 to-green-500",
  },
  {
    title: "Innovation",
    description:
      "We continuously explore modern technologies that redefine the future of education.",
    icon: Lightbulb,
    glow: "from-fuchsia-500 to-purple-500",
  },
  {
    title: "Continuous Learning",
    description:
      "Learning never stops. We encourage curiosity, mentorship, and lifelong growth.",
    icon: BookOpen,
    glow: "from-orange-500 to-amber-500",
  },
];

const principles = [
  "Build technology that empowers learning.",
  "Create inclusive and welcoming educational spaces.",
  "Encourage collaboration over competition.",
  "Maintain transparency and ethical innovation.",
  "Support contributors and open-source communities.",
  "Continuously improve through feedback and learning.",
];

export default function ValuesPage() {
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
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="absolute top-[40%] right-[10%] h-[300px] w-[300px] rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 space-y-32">
          {/* Hero */}
          <section className="pt-12 text-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-5 py-2 text-sm font-medium text-fuchsia-700 dark:text-fuchsia-200 backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                Our Values
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                Principles That{" "}
                <span className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 dark:from-fuchsia-400 dark:via-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Shape
                </span>
                <br />
                Learnova
              </h1>

              <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Learnova is built on strong principles that prioritize students,
                accessibility, collaboration, transparency, and innovation.
                These values guide every product decision and community
                interaction.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-slate-950 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
                >
                  Join Learnova
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/mission"
                  className="rounded-full border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-6 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] hover:border-fuchsia-500/30 hover:bg-white dark:hover:bg-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]"
                >
                  Explore Our Mission
                </Link>
              </div>
            </motion.div>
          </section>

          {/* Values Grid */}
          <section className="space-y-16">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                Core Values
              </h2>

              <p className="mx-auto max-w-2xl text-slate-500 dark:text-slate-400">
                These principles define the culture, vision, and direction of
                Learnova.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {values.map((value, index) => {
                const Icon = value.icon;

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group perspective-[2000px] h-[360px]"
                  >
                    <div
                      className="
                        relative h-full w-full
                        transition-transform duration-700
                        transform-style-preserve-3d
                        group-hover:rotate-y-180
                        "
                    >
                      {/* FRONT */}
                      <div
                        className="
                        absolute inset-0
                        backface-hidden
                        rounded-[2rem]
                        border border-slate-200/80
                        dark:border-white/10
                        bg-white/80
                        dark:bg-white/5
                        p-7
                        backdrop-blur-xl
                        overflow-hidden
                        transition-all duration-500
                        hover:border-fuchsia-500/50
                        dark:hover:border-fuchsia-400/50
                        hover:shadow-[0_20px_80px_rgba(168,85,247,0.18)]
                        dark:hover:shadow-[0_20px_80px_rgba(168,85,247,0.12)]
                        flex flex-col
                        "
                      >
                        <div
                          className={`
                            mb-6 flex h-16 w-16 items-center justify-center rounded-2xl
                            bg-gradient-to-br ${value.glow}
                            shadow-lg transition-all duration-500
                            group-hover:scale-110
                            group-hover:rotate-3
                            group-hover:shadow-[0_0_40px_rgba(168,85,247,0.45)]
                            `}
                        >
                          <Icon className="h-8 w-8 text-white" />
                        </div>

                        <h3 className="mb-4 text-[28px] font-black leading-tight text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-300">
                          {value.title}
                        </h3>

                        <p className="text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                          {value.description}
                        </p>

                        <div className="mt-auto pt-8 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-300">
                          Hover to learn more →
                        </div>
                      </div>

                      {/* BACK */}
                      <div
                        className="
                        absolute inset-0
                        backface-hidden
                        rounded-[2rem]
                        border border-fuchsia-500/30
                        dark:border-fuchsia-400/30
                        bg-gradient-to-br
                        from-fuchsia-500/10
                        via-violet-500/10
                        to-cyan-500/10
                        dark:from-fuchsia-500/15
                        dark:via-violet-500/15
                        dark:to-cyan-500/15
                        p-6
                        backdrop-blur-xl
                        overflow-hidden
                        shadow-[0_20px_80px_rgba(168,85,247,0.18)]
                        flex flex-col justify-between
                        "
                        style={{ transform: "rotateY(180deg)" }}
                      >
                        <div>
                          <div
                            className={`
                            mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
                            bg-gradient-to-br ${value.glow}
                            shadow-[0_0_40px_rgba(168,85,247,0.35)]
                            `}
                          >
                            <Icon className="h-8 w-8 text-white" />
                          </div>

                          <h3 className="mb-4 text-[28px] font-black leading-tight text-slate-900 dark:text-white">
                            {value.title}
                          </h3>

                          <div className="space-y-4">
                            <p className="text-[15px] leading-7 text-slate-600 dark:text-slate-300">
                              {value.title === "Student First" && (
                                <>
                                  Learnova prioritizes{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    student-first experiences
                                  </span>{" "}
                                  by designing tools that simplify learning,
                                  improve engagement, and create meaningful
                                  educational journeys.
                                </>
                              )}

                              {value.title === "Accessibility" && (
                                <>
                                  Learnova believes{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    accessibility
                                  </span>{" "}
                                  is fundamental to education, ensuring every
                                  learner can access resources and opportunities
                                  without barriers.
                                </>
                              )}

                              {value.title === "Open Collaboration" && (
                                <>
                                  Learnova encourages{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    open collaboration
                                  </span>{" "}
                                  where contributors, educators, and students
                                  work together to create innovative learning
                                  solutions.
                                </>
                              )}

                              {value.title === "Transparency" && (
                                <>
                                  Learnova values{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    transparency
                                  </span>{" "}
                                  through honest communication, ethical
                                  development, and clear community-driven
                                  decision making.
                                </>
                              )}

                              {value.title === "Innovation" && (
                                <>
                                  Learnova continuously invests in{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    innovation
                                  </span>{" "}
                                  to redefine educational experiences using
                                  modern and intelligent technologies.
                                </>
                              )}

                              {value.title === "Continuous Learning" && (
                                <>
                                  Learnova promotes{" "}
                                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                                    continuous learning
                                  </span>{" "}
                                  by encouraging curiosity, mentorship, skill
                                  development, and lifelong educational growth.
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 text-sm font-medium text-cyan-600 dark:text-cyan-300">
                          Built for the future of education ✦
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Community Principles */}
          <section className="relative space-y-20">
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="absolute right-0 bottom-0 h-[250px] w-[250px] rounded-full bg-fuchsia-500/10 blur-3xl" />
            </div>

            {/* Heading */}
            <div className="relative z-10 text-center space-y-6">
              <h2 className="text-4xl sm:text-5xl lg:text-5xl font-black tracking-tight leading-tight">
                Principles That Build{" "}
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 dark:from-cyan-400 dark:via-blue-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
                  Strong Communities
                </span>
              </h2>

              <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-500 dark:text-slate-400">
                Learnova believes meaningful learning happens when communities
                collaborate, support each other, and grow together through
                innovation, inclusivity, and shared knowledge.
              </p>
            </div>

            {/* Principles Grid */}
            <div className="relative z-10 grid gap-6 md:grid-cols-2">
              {principles.map((principle, index) => (
                <div
                  key={principle}
                  className="
        group relative overflow-hidden
        rounded-[2rem]
        border border-slate-200/80
        dark:border-white/10
        bg-white/80
        dark:bg-white/5
        p-7
        backdrop-blur-xl
        transition-all duration-500
        hover:-translate-y-3
        hover:scale-[1.02]
        hover:border-cyan-500/50
        dark:hover:border-cyan-400/50
        hover:bg-white
        dark:hover:bg-white/[0.08]
        hover:shadow-[0_20px_80px_rgba(34,211,238,0.18)]
        dark:hover:shadow-[0_20px_80px_rgba(34,211,238,0.12)]
        "
                >
                  {/* Animated gradient glow */}
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/5" />

                  <div className="relative z-10 flex items-start gap-5">
                    {/* Number Circle */}
                    <div
                      className="
            flex h-14 w-14 shrink-0 items-center justify-center
            rounded-full
            bg-gradient-to-br from-cyan-500 to-blue-500
            text-lg font-black text-white
            shadow-lg
            transition-all duration-500
            group-hover:scale-110
            group-hover:rotate-6
            group-hover:shadow-[0_0_40px_rgba(34,211,238,0.45)]
            "
                    >
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors duration-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                        Community Principle
                      </h3>

                      <p className="text-[15px] leading-8 text-slate-600 dark:text-slate-300">
                        {principle}
                      </p>

                      <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
                        This principle helps Learnova maintain an inclusive,
                        collaborative, and innovation-driven educational
                        ecosystem for students, educators, and contributors.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 px-8 py-20 text-center backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/30 via-transparent to-cyan-500/20" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                <Sparkles className="h-10 w-10 text-white" />
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Driven By Purpose
              </h2>

              <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
                Learnova is more than a platform. It is a growing educational
                ecosystem built on collaboration, innovation, accessibility, and
                community-driven learning.
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
