export const metadata = {
  title: "Sign in — Learnova",
  description:
    "Sign in to your Learnova account. Access your student, teacher, or institution dashboard.",
  openGraph: {
    title: "Sign in | Learnova",
    description: "Sign in to your Learnova account.",
    url: "https://learnova-web.vercel.app/auth",
  },
};

/**
 * Auth layout — renders children inside a completely isolated full-screen
 * shell so the global Navbar and Footer are not visible on auth pages.
 * The shell itself is just a plain div; all visual chrome lives in the page.
 */
export default function AuthLayout({ children }) {
  return <div className="auth-shell contents">{children}</div>;
}
