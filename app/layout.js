import React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollToTop from "@/components/ScrollToTop";
import BackToTop from "@/components/ui/BackToTop";
import OfflineIndicator from "@/components/OfflineIndicator";
import ScrollProgress from "@/components/ui/ScrollProgress";
import AllProviders from "./providers/AllProviders";
import { metadata } from "@/lib/seo/siteMetadata";
import { siteStructuredData } from "@/lib/seo/siteStructuredData";
import NextTopLoader from "nextjs-toploader";
import RouteAnnouncer from "@/components/RouteAnnouncer";

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteStructuredData) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`font-sans ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen transition-colors duration-300`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:p-4 focus:bg-blue-600 focus:text-white focus:font-bold focus:outline-none focus:ring-2"
        >
          Skip to Main Content
        </a>
          {/* Cursor glow removed per UX preference */}
          
        <AllProviders>
          <ScrollProgress />
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
            <main id="main-content" className="outline-none" tabIndex="-1">
              <PageTransition>{children}</PageTransition>
            </main>

            <ScrollToTop />

            <Footer />
            <ClientLayout />
            <BackToTop />
            <RouteAnnouncer />

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: { fontWeight: 600 },
              }}
            />
            <OfflineIndicator />
          </Suspense>
        </AllProviders>
      </body>
    </html>
  );
}
