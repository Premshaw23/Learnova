import Link from "next/link";

export const metadata = {
  title: "Admin Workload Reduction | Learnova",
  description: "How Learnova reduces administrative workload by 45%.",
};

export default function EfficiencyMetricsPage() {
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
        45% Admin Workload Reduction
      </h1>
      <p className="mt-4 text-slate-400 text-lg max-w-2xl">
        By automating attendance, compliance audits, and report generation,
        Learnova gives administrators back significant time each week. Full
        efficiency breakdown coming soon.
      </p>

      <div className="mt-12 rounded-xl border border-white/10 bg-white/5 p-8">
        <p className="text-slate-400 text-sm">
          Detailed workflow analysis and time-savings data will be published
          here. In the meantime, explore the{" "}
          <Link href="/case-studies/impact" className="text-purple-400 underline hover:text-purple-300">
            Impact Reports
          </Link>{" "}
          page.
        </p>
      </div>
    </main>
  );
}