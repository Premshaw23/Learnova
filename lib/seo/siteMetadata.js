export const metadata = {
  title: {
    default: "Learnova — Smart Attendance & Curriculum Management",
    template: "%s | Learnova",
  },
  description:
    "The most advanced platform for curriculum planning and attendance management. Designed for teachers, students, and institutions.",
  keywords: [
    "attendance management",
    "curriculum planning",
    "school management",
    "student dashboard",
    "teacher tools",
    "academic management",
    "student engagement",
    "smart attendance",
    "classroom management",
    "Learnova",
  ],
  authors: [{ name: "Learnova Team" }],
  creator: "Learnova",
  publisher: "Learnova",
  applicationName: "Learnova",
  metadataBase: new URL("https://learnova-web.vercel.app"),
  alternates: {
    canonical: "https://learnova-web.vercel.app",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Learnova",
    startupImage: ["/icons/apple-touch-icon.png"],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Learnova — Smart Attendance & Curriculum Management",
    description:
      "Manage attendance, curriculum, and academic workflows in one platform. Built for teachers, students, and institutions.",
    url: "https://learnova-web.vercel.app",
    siteName: "Learnova",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Learnova — Smart Attendance & Curriculum Management",
        type: "image/jpeg",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Learnova — Smart Attendance & Curriculum Management",
    description:
      "Smart attendance and curriculum management for modern institutions.",
    site: "@learnova",
    creator: "@learnova",
    images: ["/og-image.jpg"],
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  verification: {
    google: "3qjYnT7GW81-zwJBwv3wJABvxbiSOgDyAlTCKxh9nEs",
  },
};
