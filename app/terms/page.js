"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-20">
                <div className="mb-12">
                    <h1 className="text-5xl font-bold mb-4">
                        Terms & Conditions
                    </h1>

                    <p className="text-muted-foreground text-lg">
                        Please read these terms carefully before using Learnova.
                    </p>
                </div>

                <div className="space-y-10 leading-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            1. Introduction
                        </h2>

                        <p className="text-muted-foreground">
                            Welcome to Learnova, an AI-powered smart student
                            engagement and attendance platform designed for
                            modern educational institutions. By accessing or
                            using Learnova, you agree to comply with these Terms
                            and Conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            2. Platform Usage
                        </h2>

                        <p className="text-muted-foreground">
                            Learnova provides attendance management, academic
                            engagement tools, dashboards, AI assistance, and
                            institutional communication features for students,
                            teachers, institutes, and administrators.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            3. User Responsibilities
                        </h2>

                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>
                                Users must provide accurate registration
                                information.
                            </li>

                            <li>
                                Users are responsible for maintaining account
                                confidentiality.
                            </li>

                            <li>
                                Unauthorized access, misuse, or harmful activity
                                on the platform is prohibited.
                            </li>

                            <li>
                                Educational data and attendance records should
                                not be manipulated fraudulently.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            4. Privacy & Data
                        </h2>

                        <p className="text-muted-foreground">
                            Learnova values user privacy and securely processes
                            attendance records, profile information, and
                            educational data only for institutional and platform
                            functionality purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            5. AI Features
                        </h2>

                        <p className="text-muted-foreground">
                            Learnova may include AI-powered tools such as
                            attendance assistance, chatbot support, and smart
                            engagement systems. These features are intended to
                            improve user experience and educational efficiency.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-3">
                            6. Changes to Terms
                        </h2>

                        <p className="text-muted-foreground">
                            Learnova reserves the right to update or modify
                            these Terms and Conditions at any time. Continued
                            use of the platform after changes implies acceptance
                            of the updated terms.
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