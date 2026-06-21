"use client";
import { FaDiscord } from "react-icons/fa";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowUpRight,
  Github,
  Linkedin,
  Youtube,
  Heart,
  Sparkles,
  Keyboard,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "../constants/contact";

// Reusable footer link component with hover animations
function FooterLink({ href, children, external = false }) {
  const LinkComponent = external ? "a" : Link;
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <motion.li
      whileHover={{ x: 4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <LinkComponent
        href={href}
        {...externalProps}
        className="group flex items-center gap-2 text-sm text-slate-300 transition-colors duration-200 ease-out hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm"
      >
        <span className="relative">
          {children}
          {external && (
            <ExternalLink size={14} className="ml-1 inline shrink-0" />
          )}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <ArrowUpRight
          size={12}
          className="opacity-0 transition-all duration-300 group-hover:opacity-100 sm:opacity-100"
        />
      </LinkComponent>
    </motion.li>
  );
}

// Social icon button
function XIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
// Animated social media icon button with configurable glow effects
function SocialIcon({ href, icon: Icon, label, glowColor = "purple" }) {
  const glowMap = {
    purple:
      "hover:shadow-purple-500/30 hover:border-purple-500/50 hover:text-purple-400",
    blue: "hover:shadow-blue-500/30 hover:border-blue-500/50 hover:text-blue-400",
    red: "hover:shadow-red-500/30 hover:border-red-500/50 hover:text-red-400",
  };

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      whileHover={{ scale: 1.15, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 backdrop-blur-sm transition-all duration-200 ease-out hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${glowMap[glowColor]}`}
    >
      <Icon size={18} />
    </motion.a>
  );
}
// Shared Framer Motion animation variants for footer elements
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Footer() {
  // Dynamically update copyright year
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const [hoveredBrandLetter, setHoveredBrandLetter] = useState(null);
// Navigation links displayed in the footer
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Productivity", href: "/productivity" },
    { label: "Activities", href: "/activity" },
    { label: "Contact", href: "/contact" },
    { label: "Register", href: "/register" },
    { label: "Contributors", href: "/contributors" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Streaks", href: "/streaks" },
    {
      label: "GitHub Codebase",
      href: "https://github.com/Premshaw23/Learnova",
      external: true,
    },
    { label: "Discord Server", href: "https://discord.gg/", external: true },
  ];
// Landing page section shortcuts
  const sectionLinks = [
    { label: "Mission", href: "/#mission" },
    { label: "Values", href: "/#values" },
    { label: "Productivity", href: "/#productivity" },
    { label: "Impact", href: "/#impact" },
  ];
// Social media and community links
  const socialLinks = [
    {
      icon: Github,
      href: "https://github.com/Premshaw23/Learnova",
      label: "GitHub",
      glow: "purple",
    },
    { icon: XIcon, href: "https://x.com/learnova", label: "X", glow: "blue" },
    {
      icon: Linkedin,
      href: "https://linkedin.com/company/learnova",
      label: "LinkedIn",
      glow: "blue",
    },
    {
      icon: Youtube,
      href: "https://youtube.com/@learnova",
      label: "YouTube",
      glow: "red",
    },
  ];
// Individual letters used for animated Learnova branding
  const brandLetters = "LEARNOVA".split("");

  /* Main footer container */
  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_38%),linear-gradient(180deg,rgba(9,9,11,0.94),rgba(3,7,18,1))] text-foreground transition-colors duration-300">
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Main Card Container */}
        <div className="grid gap-10 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-8 md:grid-cols-2 lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          {/* Brand Column */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 ring-1 ring-white/10 sm:h-12 sm:w-12 sm:rounded-2xl">
                <BookOpen className="h-5 w-5 text-fuchsia-200" />
              </span>
              <div>
                <p className="text-lg font-semibold text-white sm:text-xl">
                  Learnova
                </p>
                <p className="text-[10px] uppercase tracking-[0.32em] text-fuchsia-200/80 sm:text-xs">
                  Smart Learning
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-300 max-w-sm">
              AI-powered engagement and smart attendance for modern campuses.
            </p>
            <div>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Get Started <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {socialLinks.map((s) => (
                <SocialIcon key={s.label} {...s} />
              ))}
              <motion.a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.95 }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30 hover:border-purple-500/50 hover:text-purple-400"
              >
                <FaDiscord size={18} />
              </motion.a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-sm">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
              {quickLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
              <li
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("learnova:open-shortcuts")
                  )
                }
                className="col-span-2 cursor-pointer group flex items-center gap-2 text-sm text-slate-300 hover:text-white"
              >
                <Keyboard className="h-4 w-4 text-fuchsia-200" /> Keyboard
                Shortcuts
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-sm">
              Sections
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:block sm:space-y-3">
              {sectionLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.28em] text-white/90 sm:text-sm">
              Contact
            </h3>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 space-y-2 sm:rounded-2xl">
              <p>
                Email:{" "}
                <a
                  href={`mailto:${CONTACT_INFO.email}`}
                  className="hover:underline hover:text-blue-500 transition-colors"
                >
                  {CONTACT_INFO.email}
                </a>
              </p>
              <p>Phone: {CONTACT_INFO.phone}</p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-purple-400 hover:underline"
              >
                Get in touch <ExternalLink size={11} />
              </Link>
            </div>
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 p-4 sm:rounded-2xl">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-fuchsia-200 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">
                    Built for modern campuses
                  </p>
                  <p className="text-[10px] leading-relaxed text-slate-300">
                    Track attendance, reduce admin load, and keep every
                    stakeholder aligned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Pill Elements */}
        <motion.div
          className="mt-10 flex flex-col gap-6 border-t border-white/10 pt-6 items-center text-center sm:mt-12 sm:flex-row sm:justify-between sm:pt-8 sm:text-left"
          variants={itemVariants}
        >
          <p className="text-sm text-slate-400">
            © {currentYear} Learnova. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-slate-400 w-full sm:w-auto">
            <span className="flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-purple-200 w-full sm:w-auto">
              <Heart size={10} className="fill-purple-400/80" /> Trusted by
              educators
            </span>
            <span className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-slate-200 w-full sm:w-auto">
              Built for modern classrooms
            </span>
          </div>
        </motion.div>

        {/* Brand Animation */}
        <div className="mt-12 flex justify-center select-none overflow-hidden sm:mt-16">
          {brandLetters.map((letter, i) => (
            <span
              key={i}
              className="text-[12vw] sm:text-[10vw] font-black text-white/5 cursor-default hover:text-purple-400/30 transition-all"
              onMouseEnter={() => setHoveredBrandLetter(i)}
              onMouseLeave={() => setHoveredBrandLetter(null)}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
