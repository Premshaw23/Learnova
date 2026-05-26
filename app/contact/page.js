"use client";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { CONTACT_INFO } from '@/constants/contact';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Twitter,
  Linkedin,
  Facebook,
  Sparkles,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";

export default function Contact() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : true;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTimer, setCooldownTimer] = useState(0);

  useEffect(() => {
    let interval; // Store interval reference securely
    const COOLDOWN_MS = 60 * 1000;
    const lastSubmit = localStorage.getItem('learnova_contact_last_submit');
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      if (remaining > 0) {
        setCooldown(true);
        setCooldownTimer(remaining);
        interval = setInterval(() => {
          setCooldownTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    // CRITICAL FIX: Cleanup function to destroy the interval on component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, message } = formData;

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!message.trim() || message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const COOLDOWN_MS = 60 * 1000;
  const lastSubmit = localStorage.getItem('learnova_contact_last_submit');
  if (lastSubmit && Date.now() - parseInt(lastSubmit) < COOLDOWN_MS) {
    setSubmitStatus({
      type: 'error',
      message: `Please wait ${cooldownTimer} seconds before sending another message.`,
    });
    return;
  }

  if (!validateForm()) {
    setSubmitStatus({
      type: "error",
      message: "Please fix the highlighted fields before submitting.",
    });
    return;
  }

  setIsSubmitting(true);
  setSubmitStatus(null);

  try {
    await emailjs.send(
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
      { ...formData },
      process.env.NEXT_PUBLIC_EMAILJS_USER_ID
    );

    setSubmitStatus({
      type: "success",
      message: "Thank you! Your message has been sent successfully.",
      
    });
    toast.success("Message sent successfully!");

    setFormData({
      name: "",
      email: "",
      company: "",
      message: "",
    });

    localStorage.setItem('learnova_contact_last_submit', Date.now().toString());
    setCooldown(true);
    let seconds = 60;
    setCooldownTimer(seconds);
    const interval = setInterval(() => {
      seconds -= 1;
      setCooldownTimer(seconds);
      if (seconds === 0) {
        clearInterval(interval);
        setCooldown(false);
      }
    }, 1000);

    setErrors({});
  } catch (error) {
    setSubmitStatus({
      type: "error",
      message: "Sorry, something went wrong. Please try again later.",
     
    });
     toast.error("Failed to send message");
  } finally {
    setIsSubmitting(false);
  }
};

  const contactInfo = [
    {
      icon: Mail,
      label: "Email",
      value: CONTACT_INFO.email,
      href: `mailto:${CONTACT_INFO.email}`,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Phone,
      label: "Phone",
      value: CONTACT_INFO.phone,
      href: "tel:+919310243800",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "Bhopal, India",
      gradient: "from-purple-500 to-pink-500",
    },
  ];

  const socialLinks = [
    {
      icon: Twitter,
      label: "Twitter",
      href: "https://twitter.com/learnova",
      color: "hover:text-blue-400",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://linkedin.com/company/learnova",
      color: "hover:text-blue-600",
    },
    {
      icon: Facebook,
      label: "Facebook",
      href: "https://facebook.com/learnova",
      color: "hover:text-blue-500",
    },
  ];

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-background">
        {isDark && <DarkVeil />}

        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl top-20 left-10 animate-pulse" />
          <div
            className="absolute w-72 h-72 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-full blur-3xl bottom-20 right-10 animate-pulse"
            style={{ animationDelay: "2s" }}
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent/30 rounded-full animate-float"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + i * 10}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="min-h-screen relative z-50">
        <Navbar />

        {/* Hero Section */}
        <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/10 to-purple-500/10 dark:from-accent/20 dark:to-purple-500/20 rounded-full border border-accent/20 dark:border-accent/30 backdrop-blur-sm mb-6">
              <MessageCircle className="w-5 h-5 text-accent dark:text-accent-foreground mr-2" />
              <span className="text-accent dark:text-accent-foreground font-medium">Get in Touch</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground dark:text-white mb-6">
              Contact{" "}
              <span className="bg-gradient-to-r from-accent via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Learnova
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Ready to transform your educational institution? Let's discuss how
              Learnova can streamline your operations and enhance student
              success.
            </p>
          </div>
        </section>

        <div className="px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Contact Form */}
              <div className="relative">
                <div className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border hover:border-accent/30 transition-border duration-500">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                      Send us a Message
                    </h2>
                    <p className="text-muted-foreground">
                      Fill out the form below and our team will get back to you
                      within 24 hours.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="contact-name" className="block text-foreground font-medium">
                          Full Name *
                        </label>
                        <input
                          id="contact-name"
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          className="w-full p-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 transition-colors duration-300"
                        />
                        {errors.name && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contact-email" className="block text-foreground font-medium">
                          Email Address *
                        </label>
                        <input
                          id="contact-email"
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="you@example.com"
                          className="w-full p-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 transition-colors duration-300"
                        />
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1">
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-company" className="block text-foreground font-medium">
                        Institution/Company
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your institution or company name"
                        className="w-full p-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 transition-colors duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="contact-message" className="block text-foreground font-medium">
                        Message *
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        rows="5"
                        placeholder="Tell us about your needs and how we can help..."
                        className="w-full p-4 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/50 transition-colors duration-300 resize-none"
                      />
                      {errors.message && (
                        <p className="text-red-400 text-sm mt-1">
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Status */}
                    {submitStatus && (
                      <div
                        className={`p-4 rounded-xl flex items-center gap-3 ${submitStatus.type === "success"
                          ? "bg-green-500/20 border border-green-500/30 text-green-300"
                          : "bg-red-500/20 border border-red-500/30 text-red-300"
                          }`}
                      >
                        {submitStatus.type === "success" ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                        <span>{submitStatus.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || cooldown}
                      className="group w-full bg-gradient-to-r from-accent to-purple-500 text-white py-4 px-6 rounded-xl font-semibold hover:shadow-xl hover:shadow-accent/25 transition-transform duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : cooldown ? (
                        <>
                          <Clock className="w-5 h-5" />
                          Please wait {cooldownTimer}s
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-8">
                {/* Contact Details */}
                <div className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Get in Touch
                  </h3>

                  <div className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="group flex items-start gap-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                        >
                          <info.icon className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm">{info.label}</p>

                          {info.href ? (
                            <a
                              href={info.href}
                              className="text-foreground text-lg font-medium hover:text-accent transition-colors duration-300"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-foreground text-lg font-medium">
                              {info.value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Hours */}
                <div className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">
                      Business Hours
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="text-foreground font-medium">
                        9:00 AM - 6:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="text-foreground font-medium">
                        10:00 AM - 4:00 PM
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="text-muted-foreground">Closed</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
                    <p className="text-accent text-sm">
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      For urgent support, we respond to emails within 2 hours
                      during business days.
                    </p>
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-card backdrop-blur-xl rounded-3xl p-8 border border-border">
                  <h3 className="text-2xl font-bold text-foreground mb-6">
                    Follow Us
                  </h3>

                  <div className="flex gap-4">
                    {socialLinks.map((social, index) => (
                      <Link
                        key={index}
                        href={social.href}
                        className={`w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-muted-foreground ${social.color} transition-transform duration-300 hover:scale-110 hover:border-current`}
                      >
                        <social.icon className="w-6 h-6" />
                      </Link>
                    ))}
                  </div>

                  <p className="text-muted-foreground text-sm mt-4">
                    Stay updated with our latest features and educational
                    insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
