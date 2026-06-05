// Auth-gated page: must not be statically prerendered.
// useRouter / useAuth are runtime-only — force dynamic rendering to avoid
// "Invalid hook call" errors during Next.js static export.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notices · Learnova",
  description:
    "School-wide announcements and notice board for students and staff",
  openGraph: {
    title: "Notices · Learnova",
    description:
      "School-wide announcements and notice board for students and staff",
    type: "website",
    siteName: "Learnova",
  },
  twitter: {
    card: "summary_large_image",
    title: "Notices · Learnova",
    description:
      "School-wide announcements and notice board for students and staff",
  },
};

export default function NoticesLayout({ children }) {
  return children;
}
