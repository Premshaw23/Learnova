export const siteStructuredData = [
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
