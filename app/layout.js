// 1. Enhanced layout.js with proper structured data for sitelinks

import { NotificationProvider } from "@/contexts/NotificationContext";
import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ErrorBoundary from "@/components/ErrorBoundary"; // Imported ErrorBoundary
import LearnovaChatbot from "@/components/ChatBot";
import ClientLayout from "@/components/ClientLayout";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import BackToTop from "@/components/BackToTop";
import OfflineIndicator from "@/components/OfflineIndicator";


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

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "website",
    name: "Learnova",
    alternateName: "Learnova Education Platform",
    url: "https://learnova-web.vercel.app",
    description:
      "AI-powered student engagement and smart attendance platform",
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Canonical and sitemap */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`font-sans ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen transition-colors duration-300`}
      >
          {/* Cursor glow removed per UX preference */}
          
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <Suspense fallback={null}>
                <PageTransition>{children}</PageTransition>

                <ScrollToTop />

                {/* Chatbot safely isolated inside ErrorBoundary */}
                <div className="z-50">
                  <ErrorBoundary>
                    <LearnovaChatbot />
                  </ErrorBoundary>
                </div>

                <Footer />
                <ClientLayout />
                <BackToTop />

                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: { fontWeight: 600 },
                  }}
                />
                <OfflineIndicator />
              </Suspense>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}