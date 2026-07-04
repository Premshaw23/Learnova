"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>

          <p className="text-muted-foreground text-lg">
            Your privacy matters to us. This policy explains how Learnova
            collects, uses, and protects your data.
          </p>
        </div>

        <div className="space-y-10 leading-8">
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              1. Information We Collect
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                Account information such as name, email address, and role
                (student, teacher, administrator).
              </li>
              <li>
                Attendance records and academic engagement data generated
                through platform usage.
              </li>
              <li>
                Device and usage information such as browser type, IP address,
                and pages visited.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              2. How We Use Your Data
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                To provide and improve attendance management and academic
                engagement features.
              </li>
              <li>
                To communicate important platform updates and notifications.
              </li>
              <li>
                To support AI-powered features such as chatbot assistance and
                smart engagement systems.
              </li>
              <li>
                To ensure platform security and prevent unauthorized access.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              3. Data Storage & Security
            </h2>
            <p className="text-muted-foreground">
              Learnova stores your data securely using industry-standard
              encryption and access controls. Educational data and attendance
              records are accessible only to authorized users within your
              institution.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              Learnova does not sell or share your personal data with third
              parties for marketing purposes. Data may be shared only with your
              institution administrators or as required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Your Rights</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You may request access to your personal data at any time.</li>
              <li>
                You may request correction of inaccurate or incomplete data.
              </li>
              <li>
                You may request deletion of your account and associated data,
                subject to institutional policies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground">
              Learnova uses cookies and similar technologies to maintain session
              state, remember user preferences, and improve platform
              performance. You may disable cookies in your browser settings,
              though this may affect platform functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              7. Changes to This Policy
            </h2>
            <p className="text-muted-foreground">
              Learnova reserves the right to update this Privacy Policy at any
              time. Continued use of the platform after changes implies
              acceptance of the updated policy. Please review this page
              periodically for updates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">8. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or how your
              data is handled, please reach out via our{" "}
              <a href="/contact" className="text-purple-400 hover:underline">
                contact page
              </a>
              .
            </p>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
