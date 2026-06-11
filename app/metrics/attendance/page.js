import Link from "next/link";

export const metadata = {
  title: "Attendance Tracking Accuracy | Learnova",
  description: "How Learnova achieves 99.8% attendance tracking accuracy.",
};

export default function AttendanceMetricsPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] text-white px-6 py-20 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
        Platform Metrics
      </span>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">
        99.8% Attendance Tracking Accuracy
      </h1>
      <p className="mt-4 text-slate-400 text-lg max-w-2xl">
        Learnova's AI Attendance Engine uses face recognition and multi-factor
        validation to eliminate proxy attendance and manual errors. Detailed
        benchmark data coming soon.
      </p>

      <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-8">
        <p className="text-slate-400 text-sm">
          Full methodology and institution-level data will be published here. In
          the meantime, explore the{" "}
          <Link
            href="/case-studies/impact"
            className="text-purple-400 underline hover:text-purple-300"
          >
            Impact Reports
          </Link>{" "}
          page.
        </p>
      </div>
    </main>
  );
}
