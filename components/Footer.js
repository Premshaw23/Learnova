"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Github,
  Keyboard,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { CONTACT_INFO } from "../constants/contact";



export default function Footer() {
  const currentYear = new Date().getFullYear();



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
    { label: "Team", href: "/#team" },
    { label: "Impact", href: "/#impact" },
    { label: "Get Started", href: "/#get-started" },
  ];

  const socialLinks = [
    {
      label: "GitHub",
      href: "https://github.com/Premshaw23/Learnova",
      icon: Github,
    },
    {
      label: "Email",
      href: `mailto:${CONTACT_INFO.email}`,
      icon: Mail,
    },
    {
      label: "Call",
      href: `tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`,
      icon: Phone,
    },
  ];

  const contactLinks = [
    {
      label: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      icon: Mail,
    },
    {
      label: CONTACT_INFO.phone,
      href: `tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`,
      icon: Phone,
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),transparent_38%),linear-gradient(180deg,rgba(9,9,11,0.94),rgba(3,7,18,1))] text-foreground transition-colors duration-300">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-6 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <svg
          className="absolute left-0 top-0 h-full w-full opacity-[0.08]"
          viewBox="0 0 1440 420"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path d="M0 240C160 180 320 180 480 220C640 260 800 340 960 320C1120 300 1280 180 1440 150V420H0V240Z" fill="url(#footerGlow)" />
          <defs>
            <linearGradient id="footerGlow" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#A855F7" />
              <stop offset="0.5" stopColor="#22D3EE" />
              <stop offset="1" stopColor="#F472B6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[1.3fr_0.9fr_0.9fr_1fr] lg:p-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-cyan-500/20 ring-1 ring-white/10">
                <BookOpen className="h-5 w-5 text-fuchsia-200" />
              </span>
              <div>
                <p className="text-xl font-semibold tracking-tight text-white">Learnova</p>
                <p className="text-xs uppercase tracking-[0.32em] text-fuchsia-200/80">
                  Smart Learning
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-300">
              AI-powered engagement and smart attendance for modern campuses.
              Build consistent learning outcomes with real-time insights and a calmer, more connected workflow.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition-transform duration-200 hover:-translate-y-0.5"
              >
                Get Started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:-translate-y-0.5"
              >
                Contact Team
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {socialLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith("http") ? "_blank" : undefined}
                    rel={link.href.startsWith("http") ? "noreferrer noopener" : undefined}
                    aria-label={link.label}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-fuchsia-400/10 hover:text-white"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
              Quick Links
            </h3>
            <ul className="space-y-1 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"))}
                  className="group inline-flex items-center gap-2 text-left text-slate-300 transition-colors hover:text-white"
                >
                  <Keyboard className="h-4 w-4 text-fuchsia-200" />
                  <span>Keyboard Shortcuts</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
              Sections
            </h3>
            <ul className="space-y-2 text-sm">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-white"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              {contactLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-slate-300 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/10 hover:text-white"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-cyan-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="break-all">{link.label}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-cyan-500/10 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-fuchsia-200">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Built for modern campuses</p>
                  <p className="text-xs leading-5 text-slate-300">
                    Track attendance, reduce admin load, and keep every stakeholder aligned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Learnova. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-fuchsia-200/90">
              Trusted by educators
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              Built for modern classrooms
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}