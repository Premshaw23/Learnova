export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/dashboard/",
          "/student/dashboard/",
          "/teacher/dashboard/",
          "/institute/dashboard/",
          "/attendance/",
          "/complaints/",
          "/leaderboards/",
          "/notices/",
          "/productivity/",
          "/profile/",
          "/settings/",
          "/streaks/",
        ],
      },
    ],
    sitemap: "https://learnova-web.vercel.app/sitemap.xml",
    host: "https://learnova-web.vercel.app",
  };
}
