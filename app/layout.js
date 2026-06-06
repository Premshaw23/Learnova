// ─── Next.js core & React ────────────────────────────────────────────────────
import React, { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";

// ─── Third-party libraries ───────────────────────────────────────────────────
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";

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
import RouteAnnouncer from "@/components/RouteAnnouncer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ShortcutsModal from "@/components/ShortcutsModal";
import CommandPaletteWrapper from "@/components/CommandPaletteWrapper";

// ─── Context providers ───────────────────────────────────────────────────────
import AllProviders from "./providers/AllProviders";

// ─── SEO metadata & structured data ─────────────────────────────────────────
import { siteStructuredData } from "@/lib/seo/siteStructuredData";

// ─── Environment validation (server-side only, runs once at startup) ─────────
if (typeof window === "undefined") {
  try {
    const { validateEnv } = require("@/lib/env");
    validateEnv({
      throwOnError: false, // Avoid failing the build during local/CI evaluation
      warnOnce: true,
    });
  } catch (error) {
    console.error("Environment validation failed:", error.message);
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
    "google-site-verification": "3qjYnT7GW81-zwJBwv3wJABvxbiSOgDyAlTCKxh9nEs",
  },
};

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
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData) }}
        />
      </head>

      <body
        suppressHydrationWarning
        className={`font-sans ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen transition-colors duration-300`}
      >
        {/* Accessibility: skip-to-content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-4 focus:bg-blue-600 focus:text-white focus:font-bold focus:outline-none focus:ring-2"
        >
          Skip to Main Content
        </a>

        {/* Global Providers Wrapper */}
        <AllProviders>
          <ScrollProgress />

          {/* Route-change loading bar */}
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
            {/* Main content wrapper */}
            <main id="main-content" className="outline-none" tabIndex="-1">
              <ErrorBoundary>
                <PageTransition>{children}</PageTransition>
              </ErrorBoundary>
            </main>

            {/* Layout Extras */}
            <ScrollToTop />
            <Footer />
            <ClientLayout />
            <BackToTop />
            <RouteAnnouncer />
            <OfflineIndicator />
            <ShortcutsModal />
            <CommandPaletteWrapper />

            {/* Notification Toasts */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontWeight: 600 },
              }}
            />
          </Suspense>
        </AllProviders>
      </body>
    </html>
  );
}