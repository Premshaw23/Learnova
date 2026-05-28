"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import CommentSection from "@/components/CommentSection";

export default function Page() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background text-foreground pt-24">
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-8 md:p-12">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Learnova</h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl">
              AI-powered student engagement and attendance platform for modern institutions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-lg border border-border bg-background/60 hover:bg-background transition-colors"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <CommentSection />
        </section>
      </main>
    </>
  );
}
