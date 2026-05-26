export const metadata = {
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