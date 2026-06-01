import { Navbar } from "@/components/Navbar";
import {
  BookOpen,
  ShieldCheck,
  ScanFace,
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Bot,
  Smartphone,
  Settings,
  Star,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Role-Based Authentication",
    description:
      "Secure Firebase authentication with dedicated dashboards for Students, Teachers, Institutes, and Admins.",
  },
  {
    icon: ScanFace,
    title: "Face Recognition Attendance",
    description:
      "AI-powered attendance system using Face API.js for fast and contactless attendance tracking.",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboards",
    description:
      "Personalized dashboards with analytics and management tools tailored to every role.",
  },
  {
    icon: ClipboardList,
    title: "Digital Notice Board",
    description:
      "Real-time announcements and institutional updates accessible across the platform.",
  },
  {
    icon: CalendarDays,
    title: "Activity Centre",
    description:
      "Track academic, extracurricular, and co-curricular activities from a central location.",
  },
  {
    icon: Bot,
    title: "AI Learning Assistant",
    description:
      "Integrated AI chatbot providing guidance, support, and platform assistance.",
  },
  {
    icon: Smartphone,
    title: "Progressive Web App",
    description:
      "Installable on desktop and mobile devices with support for low-network environments.",
  },
  {
    icon: Settings,
    title: "Profile & Settings",
    description:
      "Personalized profiles and customizable settings for all users.",
  },
];

const reviews = [
  {
    name: "Aarav Sharma",
    role: "Student",
    review:
      "Learnova completely changed how I manage my studies. The dashboard and activity tracking help me stay productive and organized every day.",
  },
  {
    name: "Priya Verma",
    role: "Teacher",
    review:
      "The face recognition attendance system saves significant time. I can focus more on teaching instead of administrative tasks.",
  },
  {
    name: "Rohan Gupta",
    role: "Institute Administrator",
    review:
      "Managing attendance, notices, and student engagement has become incredibly efficient with Learnova.",
  },
  {
    name: "Neha Kapoor",
    role: "Parent",
    review:
      "I finally have visibility into my child's academic progress and attendance without constantly contacting the school.",
  },
  {
    name: "Vikram Singh",
    role: "Teacher",
    review:
      "The analytics and reporting tools provide insights that were previously impossible to gather manually.",
  },
  {
    name: "Ananya Patel",
    role: "Student",
    review:
      "The platform feels modern, fast, and easy to use. The AI assistant is surprisingly helpful.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6">
        {/* HERO */}
        <section className="text-center mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mb-6">
            <BookOpen className="h-4 w-4 text-blue-600" />
            AI-Powered Educational Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Transforming Education Through Intelligence & Innovation
          </h1>

          <p className="max-w-4xl mx-auto text-lg md:text-xl text-muted-foreground">
            Learnova is a modern AI-powered educational platform designed to
            eliminate the inefficiencies of traditional school management.
            Through automation, analytics, collaboration, and intelligent
            learning tools, Learnova creates a seamless experience for
            students, teachers, institutions, and parents.
          </p>
        </section>

        {/* STATS */}
        <section className="grid md:grid-cols-4 gap-6 mb-24">
          <div className="rounded-3xl border p-6 text-center shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-4xl font-bold text-blue-600">1hr+</h3>
            <p className="mt-2 text-muted-foreground">
              Saved Daily For Teachers
            </p>
          </div>

          <div className="rounded-3xl border p-6 text-center shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-4xl font-bold text-violet-600">90+</h3>
            <p className="mt-2 text-muted-foreground">
              Productive Hours Recovered Annually
            </p>
          </div>

          <div className="rounded-3xl border p-6 text-center shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-4xl font-bold text-green-600">100%</h3>
            <p className="mt-2 text-muted-foreground">
              Real-Time Attendance Visibility
            </p>
          </div>

          <div className="rounded-3xl border p-6 text-center shadow-sm hover:shadow-xl transition-all">
            <h3 className="text-4xl font-bold text-orange-500">24/7</h3>
            <p className="mt-2 text-muted-foreground">
              Smart Learning Support
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12">
            Platform Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div
                  key={index}
                  className="rounded-3xl border p-6 hover:-translate-y-2 transition-all duration-300 bg-card shadow-sm hover:shadow-xl"
                >
                  <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white mb-4">
                    <Icon size={22} />
                  </div>

                  <h3 className="font-bold text-lg mb-3">{feature.title}</h3>

                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose Learnova?
          </h2>

          <div className="grid lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border p-6">
              <h3 className="font-bold text-xl mb-4">🎒 Students</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Better organization</li>
                <li>• Attendance visibility</li>
                <li>• Academic progress tracking</li>
                <li>• Smart learning tools</li>
              </ul>
            </div>

            <div className="rounded-3xl border p-6">
              <h3 className="font-bold text-xl mb-4">🧑‍🏫 Teachers</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Reduced admin workload</li>
                <li>• Faster attendance management</li>
                <li>• Better classroom insights</li>
                <li>• Enhanced communication</li>
              </ul>
            </div>

            <div className="rounded-3xl border p-6">
              <h3 className="font-bold text-xl mb-4">🏫 Institutions</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Centralized management</li>
                <li>• Better reporting</li>
                <li>• Analytics dashboard</li>
                <li>• Increased engagement</li>
              </ul>
            </div>

            <div className="rounded-3xl border p-6">
              <h3 className="font-bold text-xl mb-4">👨‍👩‍👧 Parents</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Attendance transparency</li>
                <li>• Progress monitoring</li>
                <li>• Better communication</li>
                <li>• Real-time updates</li>
              </ul>
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12">
            Loved By Our Users
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div
                key={index}
                className="rounded-3xl border p-6 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className="fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-muted-foreground mb-4">
                  "{review.review}"
                </p>

                <h4 className="font-bold">{review.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {review.role}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[40px] bg-linear-to-r from-blue-600 to-violet-600 text-white text-center p-12">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Learning?
          </h2>

          <p className="max-w-3xl mx-auto text-lg opacity-90 mb-8">
            Join Learnova and experience the future of education through
            intelligent automation, real-time insights, and AI-powered
            productivity tools.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="/auth?mode=signup"
              className="px-6 py-3 rounded-xl bg-white text-blue-600 font-semibold hover:scale-105 transition"
            >
              Get Started
            </a>

            <a
              href="/contact"
              className="px-6 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition"
            >
              Contact Us
            </a>
          </div>
        </section>
        </div>
      </main>
    </>
  );
}