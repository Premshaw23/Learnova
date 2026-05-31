"use client";
import { Navbar } from "@/components/Navbar";
import DarkVeil from "@/components/ui-block/DarkVeil";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import FormSkeleton from "@/components/ui/FormSkeleton";
import { CONTACT_INFO } from "@/constants/contact";
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
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
  const cooldownIntervalRef = useRef(null);

  useEffect(() => {
    const savedDraft = localStorage.getItem("learnova_contact_form_draft");
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (error) {
        console.error("Failed to parse form draft:", error);
      }
    }
  }, []);

  useEffect(() => {
    const COOLDOWN_MS = 60 * 1000;
    const lastSubmit = localStorage.getItem("learnova_contact_last_submit");
    if (lastSubmit) {
      const elapsed = Date.now() - parseInt(lastSubmit);
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      if (remaining > 0) {
        setCooldown(true);
        setCooldownTimer(remaining);
        cooldownIntervalRef.current = setInterval(() => {
          setCooldownTimer((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
              setCooldown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = { ...formData, [name]: value };
    setFormData(updatedFormData);
    localStorage.setItem("learnova_contact_form_draft", JSON.stringify(updatedFormData));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { name, email, message } = formData;
    if (!name.trim() || name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Enter a valid email address";
    if (!message.trim() || message.trim().length < 10)
      newErrors.message = "Message must be at least 10 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to your Learnova account to submit this form.");
      setSubmitStatus({
        type: "error",
        message: "You are being redirected to the login page.",
      });
      setTimeout(() => router.push("/auth"), 2000);
      return;
    }
    const COOLDOWN_MS = 60 * 1000;
    const lastSubmit = localStorage.getItem("learnova_contact_last_submit");
    if (lastSubmit && Date.now() - parseInt(lastSubmit) < COOLDOWN_MS) {
      setSubmitStatus({
        type: "error",
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
    if (
      !process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ||
      !process.env.NEXT_PUBLIC_EMAILJS_USER_ID
    ) {
      setSubmitStatus({
        type: "error",
        message: `Contact form is currently unavailable. Please reach us directly at ${CONTACT_INFO.email}`,
      });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const templateParams = {
        from_name: formData.name,
        reply_to: formData.email,
        from_email: formData.email,
        company_name: formData.company || "Not Provided",
        message: formData.message,
        subject: `New Contact Form Message from ${formData.name}`,
        to_email: "test-admin@learnova.com",
        to_name: "Learnova Admin",
        email: "test-admin@learnova.com",
        receiver_email: "test-admin@learnova.com",
      };
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.NEXT_PUBLIC_EMAILJS_USER_ID
      );
      setSubmitStatus({
        type: "success",
        message: "Thank you! Your message has been sent successfully.",
      });
      toast.success("Message sent successfully!");
      localStorage.removeItem("learnova_contact_form_draft");
      setFormData({ name: "", email: "", company: "", message: "" });
      setErrors({});
    } catch (error) {
      console.error("[Contact Form] EmailJS error:", error);
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
      href: `tel:${CONTACT_INFO.phone.replace(/\s+/g, "")}`,
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
      color: "hover:text-blue-500 hover:border-blue-300 dark:hover:text-blue-400 dark:hover:border-blue-400/50",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      href: "https://linkedin.com/company/learnova",
      color: "hover:text-blue-700 hover:border-blue-400 dark:hover:text-blue-600 dark:hover:border-blue-500/50",
    },
    {
      icon: Facebook,
      label: "Facebook",
      href: "https://facebook.com/learnova",
      color: "hover:text-blue-600 hover:border-blue-300 dark:hover:text-blue-500 dark:hover:border-blue-400/50",
    },
  ];

  /* Shared class fragments */
  const cardClass =
    "bg-white dark:bg-card backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-border shadow-md shadow-slate-200/60 dark:shadow-none ring-1 ring-black/[0.04] dark:ring-white/5";

 
  const inputClass =
    "w-full p-4 bg-white dark:bg-background border border-slate-300/90 dark:border-border/80 rounded-xl text-slate-900 dark:text-foreground placeholder:text-slate-400/90 dark:placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent/60 transition-colors duration-200 shadow-sm dark:shadow-none text-sm";

  const sectionHeadingClass =
    "text-2xl font-bold text-slate-800 dark:text-foreground flex items-center gap-2 before:block before:w-1 before:h-6 before:rounded-full before:bg-accent before:shrink-0 dark:before:bg-accent";

  return (
    <>
      {/* Background */}

      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-white dark:bg-background will-change-transform">
        {isDark && <DarkVeil />}

        {/* Ambient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[28rem] h-[28rem] bg-gradient-to-r from-purple-400/15 to-pink-400/15 dark:from-purple-500/5 dark:to-pink-500/5 rounded-full blur-3xl top-16 -left-16 animate-pulse" />
          <div
            className="absolute w-80 h-80 bg-gradient-to-r from-blue-400/15 to-cyan-400/15 dark:from-blue-500/5 dark:to-cyan-500/5 rounded-full blur-3xl bottom-24 -right-12 animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute w-64 h-64 bg-gradient-to-r from-violet-400/10 to-indigo-400/10 dark:from-violet-500/5 dark:to-indigo-500/5 rounded-full blur-3xl bottom-40 left-1/3 animate-pulse"
            style={{ animationDelay: "4s" }}
          />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-accent/25 dark:bg-accent/30 rounded-full animate-float"
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

        {loading ? (
          
          <section className="pt-20 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <FormSkeleton />
            </div>
          </section>
        ) : (
          <>
            {/* ── Hero ── */}
            
            <section className="pt-20 md:pt-24 pb-8 md:pb-10 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-accent/15 to-purple-500/15 dark:from-accent/20 dark:to-purple-500/20 rounded-full border border-accent/30 dark:border-accent/30 backdrop-blur-sm mb-5 shadow-sm dark:shadow-none">
                  <MessageCircle className="w-4 h-4 text-accent mr-2" />
                  <span className="text-accent font-semibold text-sm tracking-wide">
                    Get in Touch
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  Contact{" "}
                  <span className="bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Learnova
                  </span>
                </h1>

                <p className="text-base md:text-lg text-slate-600 dark:text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                  Ready to transform your educational institution? Let&apos;s
                  discuss how Learnova can streamline your operations and enhance
                  student success.
                </p>
              </div>
            </section>

            
            <div className="px-4 sm:px-6 lg:px-8 pb-20 md:pb-24">
              <div className="max-w-7xl mx-auto">

                <div className="grid lg:grid-cols-2 gap-8 md:gap-10 lg:gap-12 items-start">

                  {/* ── Contact Form ── */}
                  <div className="relative">
                    <div className={`${cardClass} p-6 sm:p-8 lg:p-10 hover:border-accent/40 dark:hover:border-accent/30 transition-colors duration-300`}>

                      {/* Form header */}
                      <div className="mb-7 pb-5 border-b border-slate-100 dark:border-border/50">
                        <h2 className={sectionHeadingClass}>
                          Send us a Message
                        </h2>
                        <p className="text-slate-500 dark:text-muted-foreground mt-2 ml-3 text-sm">
                          Fill out the form below and our team will get back to
                          you within 24 hours.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 items-start">
                          <div className="flex flex-col gap-1.5">
                            <label
                              htmlFor="contact-name"
                              className="text-sm font-semibold text-slate-700 dark:text-foreground"
                            >
                              Full Name <span className="text-accent">*</span>
                            </label>
                            <input
                              id="contact-name"
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Enter your full name"
                              maxLength={100}
                              className={inputClass}
                            />
                            
                            <div className="min-h-[1.25rem]">
                              {errors.name && (
                                <p className="text-red-500 dark:text-red-400 text-xs font-medium">
                                  {errors.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label
                              htmlFor="contact-email"
                              className="text-sm font-semibold text-slate-700 dark:text-foreground"
                            >
                              Email Address <span className="text-accent">*</span>
                            </label>
                            <input
                              id="contact-email"
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="you@example.com"
                              maxLength={254}
                              className={inputClass}
                            />
                            <div className="min-h-[1.25rem]">
                              {errors.email && (
                                <p className="text-red-500 dark:text-red-400 text-xs font-medium">
                                  {errors.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Company */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="contact-company"
                            className="text-sm font-semibold text-slate-700 dark:text-foreground"
                          >
                            Institution / Company
                          </label>
                          <input
                            id="contact-company"
                            type="text"
                            name="company"
                            value={formData.company}
                            onChange={handleInputChange}
                            placeholder="Your institution or company name"
                            className={inputClass}
                          />
                        </div>

                        {/* Message */}
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="contact-message"
                            className="text-sm font-semibold text-slate-700 dark:text-foreground"
                          >
                            Message <span className="text-accent">*</span>
                          </label>
                          <textarea
                            id="contact-message"
                            name="message"
                            value={formData.message}
                            onChange={handleInputChange}
                            rows={5}
                            placeholder="Tell us about your needs and how we can help..."
                            maxLength={1000}
                            className={`${inputClass} resize-none`}
                          />
                          {/* FIX: Reserve space for error message to avoid jump */}
                          <div className="min-h-[1.25rem]">
                            {errors.message && (
                              <p className="text-red-500 dark:text-red-400 text-xs font-medium">
                                {errors.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {submitStatus && (
                          <div
                            className={`p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
                              submitStatus.type === "success"
                                ? "bg-green-50 border border-green-200 text-green-700 dark:bg-green-500/20 dark:border-green-500/30 dark:text-green-300"
                                : "bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/20 dark:border-red-500/30 dark:text-red-300"
                            }`}
                          >
                            {submitStatus.type === "success" ? (
                              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            )}
                            <span>{submitStatus.message}</span>
                          </div>
                        )}

                        {/* Submit button */}

                        <button
                          type="submit"
                          disabled={isSubmitting || cooldown}
                          className="group w-full bg-gradient-to-r from-accent to-purple-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg shadow-accent/25 dark:shadow-accent/10 hover:shadow-xl hover:shadow-accent/30 dark:hover:shadow-accent/20 transition-all duration-250 ease-in-out transform-gpu hover:scale-[1.015] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
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
                              <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* ── Right column ── */}
                  <div className="space-y-5 md:space-y-6">

                    {/* Contact Details */}
                    <div className={`${cardClass} p-6 sm:p-8`}>
                      <h3 className={`${sectionHeadingClass} mb-5`}>
                        Get in Touch
                      </h3>

                      <div className="divide-y divide-slate-100 dark:divide-border/40">
                        {contactInfo.map((info, index) => (
                          <div
                            key={index}
                            className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
                          >
                            <div
                              className={`w-11 h-11 shrink-0 bg-gradient-to-br ${info.gradient} rounded-xl flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-110`}
                            >
                              <info.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-muted-foreground mb-0.5">
                                {info.label}
                              </p>
                              {info.href ? (
                                <a
                                  href={info.href}
                                  className="text-slate-800 dark:text-foreground text-sm font-medium hover:text-accent dark:hover:text-accent transition-colors duration-200 break-words"
                                >
                                  {info.value}
                                </a>
                              ) : (
                                <p className="text-slate-800 dark:text-foreground text-sm font-medium break-words">
                                  {info.value}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className={`${cardClass} p-6 sm:p-8`}>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                          <Clock className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-foreground">
                          Business Hours
                        </h3>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-border/40">
                        <div className="flex justify-between items-center py-3 first:pt-0">
                          <span className="text-slate-500 dark:text-muted-foreground text-sm">
                            Monday – Friday
                          </span>
                          <span className="text-slate-800 dark:text-foreground font-semibold text-sm whitespace-nowrap">
                            9:00 AM – 6:00 PM
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-slate-500 dark:text-muted-foreground text-sm">
                            Saturday
                          </span>
                          <span className="text-slate-800 dark:text-foreground font-semibold text-sm whitespace-nowrap">
                            10:00 AM – 4:00 PM
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 last:pb-0">
                          <span className="text-slate-500 dark:text-muted-foreground text-sm">
                            Sunday
                          </span>
                          <span className="text-slate-400 dark:text-muted-foreground text-sm font-medium">
                            Closed
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-accent/8 dark:bg-accent/10 rounded-xl border border-accent/20 dark:border-accent/20">
                        <p className="text-accent dark:text-accent text-sm font-medium flex items-start gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          For urgent support, we respond to emails within 2 hours
                          during business days.
                        </p>
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className={`${cardClass} p-6 sm:p-8`}>
                      <h3 className={`${sectionHeadingClass} mb-4`}>
                        Follow Us
                      </h3>

                      <div className="flex gap-3 flex-wrap">
                        {socialLinks.map((social, index) => (
                          <Link
                            key={index}
                            href={social.href}
                            aria-label={social.label}
                            className={`w-12 h-12 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center text-slate-500 dark:text-muted-foreground shadow-sm dark:shadow-none ${social.color} transition-all duration-200 ease-in-out hover:scale-110 hover:shadow-md dark:hover:shadow-none`}
                          >
                            <social.icon className="w-5 h-5" />
                          </Link>
                        ))}
                      </div>

                      <p className="text-slate-500 dark:text-muted-foreground text-sm mt-4 leading-relaxed">
                        Stay updated with our latest features and educational
                        insights.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
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