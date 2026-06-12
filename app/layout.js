// 1. Enhanced layout.js with proper structured data for sitelinks
import SyllabusAnalytics from "../components/SyllabusAnalytics";
import LearningStreakDashboard from "../components/LearningStreakDashboard";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { FirestoreProvider } from "@/contexts/FirestoreContext";

// ─── Next.js core & React ────────────────────────────────────────────────────

import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

// ─── Third-party libraries ───────────────────────────────────────────────────
import { Toaster } from "react-hot-toast";

// ─── Global styles ───────────────────────────────────────────────────────────
import "./globals.css";

// ─── Layout & structural components ─────────────────────────────────────────
import ClientLayout from "@/components/ClientLayout";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import BackToTop from "@/components/ui/BackToTop";
import OfflineIndicator from "@/components/OfflineIndicator";
import ScrollProgress from "@/components/ui/ScrollProgress";
import NextTopLoader from "nextjs-toploader";

// 🎯 FIX: Explicitly loading overlays

import RouteAnnouncer from "@/components/RouteAnnouncer";

import ErrorBoundary from "@/components/ErrorBoundary";

// ─── Command palette (wrapper owns isOpen state via useCommandPalette hook) ──
// Conflict resolved: use CommandPaletteWrapper, NOT CommandPalette directly.
// CommandPalette requires isOpen + onClose props — it has no internal state.
// CommandPaletteWrapper wires the hook so the palette responds to Ctrl+K.

// ─── Context providers (all wrapped inside AllProviders) ─────────────────────
// AllProviders composes: ThemeProvider → AuthProvider → FirestoreProvider → NotificationProvider
import AllProviders from "./providers/AllProviders";

// ─── SEO metadata & structured data ─────────────────────────────────────────
import { siteStructuredData } from "@/lib/seo/siteStructuredData";

// 🎯 FIX: Explicitly loading overlays
import CommandPaletteWrapper from "@/components/CommandPaletteWrapper";
import ShortcutsModal from "@/components/ShortcutsModal";

// Validate environment variables at startup (server-side only).
// ─── Environment validation (server-side only, runs once at startup) ─────────
// Kept outside the component so it runs at module load time, not per-render.
// throwOnError:false keeps local dev working even without all secrets set.

if (typeof window === "undefined") {
  try {
    const { validateEnv } = require("@/lib/env");
    validateEnv({
      throwOnError: false,
      warnOnce: true,
    });
  } catch (error) {
    console.error("Environment validation failed:", error.message);
    throw error;
  }
}

// ─── Font configuration ───────────────────────────────────────────────────────
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://learnova-web.vercel.app"),
  title: {
    default: "Learnova - Smart Student Engagement & Attendance Platform",
    template: "%s | Learnova",
  },
  description:
    "AI-powered student engagement platform with smart attendance tracking, classroom management, and analytics. Trusted by 10,000+ schools worldwide for modern education technology.",
  keywords: [
    "student engagement",
    "attendance platform",
    "online learning",
    "education",
    "courses",
    "e-learning",
    "classroom management",
    "school software",
    "teacher tools",
    "smart attendance",
    "Learnova",
  ],
  authors: [{ name: "Learnova Team" }],
  creator: "Prem Shaw",
  publisher: "Learnova",
  applicationName: "Learnova",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learnova",
    startupImage: ["/icons/apple-touch-icon.png"],
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://learnova-web.vercel.app",
  },
  openGraph: {
    title: "Learnova - Smart Student Engagement & Attendance Platform",
    description:
      "AI-powered education platform with smart attendance, student engagement tools, and comprehensive analytics. Join 10,000+ schools using Learnova.",
    url: "https://learnova-web.vercel.app",
    siteName: "Learnova",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Learnova - Smart Education Platform",
        type: "image/jpeg",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learnova - Smart Student Engagement Platform",
    description:
      "Transform education with AI-powered tools. Smart attendance, engagement tracking, and analytics for modern classrooms.",
    site: "@learnova",
    creator: "@learnova",
    images: ["/og-image.jpg"],
  },
  other: {
    "google-site-verification":
      process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "website",
    name: "Learnova",
    alternateName: "Learnova Education Platform",
    url: "https://learnova-web.vercel.app",
    description: "AI-powered student engagement and smart attendance platform",
    inLanguage: "en-US",
    mainEntity: {
      "@type": "Organization",
      name: "Learnova",
      url: "https://learnova-web.vercel.app",
      logo: "https://learnova-web.vercel.app/logo.png",
      sameAs: [
        "https://twitter.com/learnova",
        "https://facebook.com/learnova",
        "https://linkedin.com/company/learnova",
        "https://youtube.com/@learnova",
      ],
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Learnova",
    description:
      "Smart student engagement and attendance platform for modern education",
    url: "https://learnova-web.vercel.app",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free trial available",
    },
    featureList: [
      "Smart Attendance Tracking",
      "Student Engagement Analytics",
      "Classroom Management Tools",
      "Teacher Dashboard",
      "Real-time Reporting",
    ],
  },
  // Site Navigation Structure for Sitelinks
  {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: "Main Navigation",
    url: "https://learnova-web.vercel.app",
    hasPart: [
      {
        "@type": "SiteNavigationElement",
        name: "Sign up",
        description:
          "Discover smart attendance tracking, student engagement tools, and classroom management features",
        url: "https://learnova-web.vercel.app/auth",
      },
      {
        "@type": "SiteNavigationElement",
        name: "Login",
        description:
          "Simple, transparent pricing plans for schools of all sizes. Start free, upgrade anytime",
        url: "https://learnova-web.vercel.app/auth",
      },
      {
        "@type": "SiteNavigationElement",
        name: "Getting Started",
        description:
          "Quick setup guide for teachers and administrators. Get started in under 5 minutes",
        url: "https://learnova-web.vercel.app/",
      },
      {
        "@type": "SiteNavigationElement",
        name: "Activity Centre",
        description:
          "Documentation, tutorials, and support resources for Learnova users",
        url: "https://learnova-web.vercel.app/activity",
      },
      {
        "@type": "SiteNavigationElement",
        name: "Wellness",
        description:
          "Explore mental health and productivity tools for a balanced study journey",
        url: "https://learnova-web.vercel.app/wellness",
      },
      {
        "@type": "SiteNavigationElement",
        name: "About Learnova",
        description:
          "Learn about our mission to transform education through technology",
        url: "https://learnova-web.vercel.app/about",
      },
      {
        "@type": "SiteNavigationElement",
        name: "Contact",
        description:
          "Real success stories from schools using Learnova to improve engagement",
        url: "https://learnova-web.vercel.app/contact",
      },
    ],
  },
];

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Favicons ── */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* ── Sitemap ── */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        {/* ── JSON-LD structured data for SEO ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(siteStructuredData),
          }}
        />
      </head>

      <body
        suppressHydrationWarning
        className={`font-sans ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen transition-colors duration-300`}
      >
        {/* ── Accessibility: skip-to-content link ── */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-4 focus:bg-blue-600 focus:text-white focus:font-bold focus:outline-none focus:ring-2"
        >
          Skip to Main Content
        </a>

        <AllProviders>
          {/* Note: Ensure these providers (ThemeProvider, AuthProvider, etc.) 
              are actually imported and exported correctly in AllProviders 
              or placed here individually if AllProviders doesn't cover them. */}

          <ScrollProgress />

          {/* ── Route-change loading bar ── */}
          <NextTopLoader
            color="#4f46e5"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #4f46e5,0 0 5px #4f46e5"
          />

          <Suspense fallback={null}>
            {/* ── Main page content with error boundary + page transitions ── */}
            <main id="main-content" className="outline-none" tabIndex="-1">
              <ErrorBoundary>
                <PageTransition>{children}</PageTransition>
              </ErrorBoundary>
            </main>

            {/* ── Scroll restoration on route change ── */}
            <ScrollToTop />
            <Footer />

            {/* ── Client-only layout: modals, chatbot, PWA install, streak sync ── */}
            <ClientLayout />
            <BackToTop />

            {/* ── Screen-reader route announcer for accessibility ── */}
            <RouteAnnouncer />
            <OfflineIndicator />

            {/* Single Toaster configuration */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontWeight: 600 },
              }}
            />

            <CommandPaletteWrapper />

            {/* 🚀 ADDED: System Shortcuts Modal integration layer */}
            <ShortcutsModal />
          </Suspense>
        </AllProviders>
      </body>
    </html>
  );
}
