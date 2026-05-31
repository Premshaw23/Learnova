"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  BookOpen, ArrowUpRight, Github, Twitter, 
  Linkedin, Youtube, Heart, Sparkles, Keyboard, ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";
import { CONTACT_INFO } from "../constants/contact";

// Animated link component
function FooterLink({ href, children, external = false }) {
  const LinkComponent = external ? "a" : Link;
  const externalProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <motion.li whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
      <LinkComponent href={href} {...externalProps} className="group flex items-center gap-2 text-sm text-slate-300 transition-colors duration-300 hover:text-white">
        <span className="relative">
          {children}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-purple-400 to-blue-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <ArrowUpRight size={12} className="opacity-0 transition-all duration-300 group-hover:opacity-100" />
      </LinkComponent>
    </motion.li>
  );
}

// Social icon button
function SocialIcon({ href, icon: Icon, label, glowColor = "purple" }) {
  const glowMap = {
    purple: "hover:shadow-purple-500/30 hover:border-purple-500/50 hover:text-purple-400",
    blue: "hover:shadow-blue-500/30 hover:border-blue-500/50 hover:text-blue-400",
    red: "hover:shadow-red-500/30 hover:border-red-500/50 hover:text-red-400",
  };

  return (
    <motion.a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
      whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.95 }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 backdrop-blur-sm transition-all duration-300 hover:shadow-lg ${glowMap[glowColor]}`}
    >
      <Icon size={18} />
    </motion.a>
  );
}

const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function Footer() {
  const [currentYear, setCurrentYear] = useState(2026);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const [hoveredBrandLetter, setHoveredBrandLetter] = useState(null);

  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Productivity", href: "/productivity" },
    { label: "Activities", href: "/activity" },
    { label: "Contact", href: "/contact" },
    { label: "Register", href: "/register" },
    { label: "Contributors", href: "/contributors" },
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Streaks", href: "/streaks" },
  ];

  const sectionLinks = [
    { label: "Mission", href: "/#mission" },
    { label: "Values", href: "/#values" },
    { label: "Productivity", href: "/#productivity" },
    { label: "Impact", href: "/#impact" },
  ];

  const socialLinks = [
    { icon: Github, href: "https://github.com/Premshaw23/Learnova", label: "GitHub", glow: "purple" },
    { icon: Twitter, href: "https://twitter.com/learnova", label: "Twitter", glow: "blue" },
    { icon: Linkedin, href: "https://linkedin.com/company/learnova", label: "LinkedIn", glow: "blue" },
    { icon: Youtube, href: "https://youtube.com/@learnova", label: "YouTube", glow: "red" },
  ];

  const brandLetters = "LEARNOVA".split("");

  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_38%),linear-gradient(180deg,rgba(9,9,11,0.94),rgba(3,7,18,1))] text-foreground transition-colors duration-300">
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr]">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <BookOpen className="h-5 w-5 text-fuchsia-200" />
              </span>
              <div>
                <p className="text-xl font-semibold text-white">Learnova</p>
                <p className="text-xs uppercase tracking-[0.32em] text-fuchsia-200/80">Smart Learning</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-6 max-w-xs">AI-powered engagement and smart attendance for modern campuses.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5">
                Get Started <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => <SocialIcon key={s.label} {...s} />)}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => <FooterLink key={link.href} href={link.href}>{link.label}</FooterLink>)}
              <li onClick={() => window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"))} className="cursor-pointer group flex items-center gap-2 text-sm text-slate-300 hover:text-white">
                <Keyboard className="h-4 w-4 text-fuchsia-200" /> Keyboard Shortcuts
              </li>
            </ul>
          </div>

          {/* Sections */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">Sections</h3>
            <ul className="space-y-3">
              {sectionLinks.map((link) => <FooterLink key={link.href} href={link.href}>{link.label}</FooterLink>)}
            </ul>
          </div>

          {/* Contact Column with Integrated Modern Campus Card */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">Contact</h3>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 space-y-2">
              <p>Email: {CONTACT_INFO.email}</p>
              <p>Phone: {CONTACT_INFO.phone}</p>
              <Link href="/contact" className="flex items-center gap-1 text-purple-400">Get in touch <ExternalLink size={11}/></Link>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-4 w-4 text-fuchsia-200 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Built for modern campuses</p>
                  <p className="text-[10px] leading-5 text-slate-300">Track attendance, reduce admin load, and keep every stakeholder aligned.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Pill Elements */}
        <motion.div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between" variants={itemVariants}>
          <p className="text-sm text-slate-400">© {currentYear} Learnova. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.24em] text-slate-400">
            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-purple-200">
              <Heart size={10} className="fill-purple-400/80" /> Trusted by educators
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-slate-200">
              Built for modern classrooms
            </span>
          </div>
        </motion.div>

        {/* Brand Animation */}
        <div className="mt-16 flex justify-center select-none overflow-hidden">
          {brandLetters.map((letter, i) => (
            <span key={i} className="text-[10vw] font-black text-white/5 cursor-default hover:text-purple-400/30 transition-all"
                  onMouseEnter={() => setHoveredBrandLetter(i)} onMouseLeave={() => setHoveredBrandLetter(null)}>
              {letter}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}