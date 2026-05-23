"use client";

import Link from "next/link";
import { BookOpen, Mail, Phone, Keyboard } from "lucide-react";
import { CONTACT_INFO } from '../constants/contact'; // Note: Adjust path if needed


export default function Footer() {
  const currentYear = new Date().getFullYear();
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Activities", href: "/activity" },
    { label: "Contact", href: "/contact" },
    { label: "Register", href: "/register" },
    { label: "Contributors", href: "/contributors" },
  ];

  const sectionLinks = [
    { label: "Mission", href: "/#mission" },
    { label: "Values", href: "/#values" },
    { label: "Team", href: "/#team" },
    { label: "Impact", href: "/#impact" },
    { label: "Get Started", href: "/#get-started" },
  ];

  return (
        <footer className="relative overflow-hidden border-t border-border bg-background text-foreground transition-colors duration-300">      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-8 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 ring-1 ring-purple-500/30">
                <BookOpen className="h-5 w-5 text-purple-300" />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">Learnova</p>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-300/80">
                  Smart Learning
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered engagement and smart attendance for modern campuses.
              Build consistent learning outcomes with real-time insights.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-purple-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("learnova:open-shortcuts"))}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-purple-300 transition-colors text-left font-normal cursor-pointer"
                >
                  <Keyboard className="h-4 w-4 text-purple-300" />
                  <span>Keyboard Shortcuts</span>
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Sections
            </h3>
            <ul className="space-y-2 text-sm">
              {sectionLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground transition-colors hover:text-purple-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contact
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 text-purple-300" />
                <span>{CONTACT_INFO.email}</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="h-4 w-4 text-purple-300" />
                <span>{CONTACT_INFO.phone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-800/80 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) {currentYear} Learnova. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.2em] text-slate-500">
            <span className="text-purple-300/80">Trusted by educators</span>
            <span className="hidden h-1 w-1 rounded-full bg-slate-700 sm:inline-block" />
            <span>Built for modern classrooms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}