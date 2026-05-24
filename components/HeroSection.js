"use client";

import { Sparkles, Shield, Zap } from "lucide-react";

export default function HeroSection({ selectedRole }) {
  return (
    <div>
      {/* Hero Content */}
      <div className="text-center lg:text-left mb-12">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 rounded-full mb-6">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">
            Premium Access
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
          Transforming Education
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg max-w-2xl mt-6">
          Join thousands of {selectedRole == "student"? "students": "professionals"} who trust our platform for secure
          attendance management and seamless academic workflows.
        </p>

        {/* CTA Button */}
        <div className="mt-8 flex justify-center lg:justify-start">
          <a
            href="#mission"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-300 shadow-lg"
          >
            Explore More ↓
          </a>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="p-6 bg-card backdrop-blur-sm rounded-xl border border-border">
          <Shield className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Enterprise Security
          </h3>
          <p className="text-muted-foreground text-sm">
            Bank-level encryption and security protocols to protect your data.
          </p>
        </div>

        {/* Card 2 */}
        <div className="p-6 bg-card backdrop-blur-sm rounded-xl border border-border">
          <Zap className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Lightning Fast
          </h3>
          <p className="text-muted-foreground text-sm">
            Instant sync across all your devices with real-time updates.
          </p>
        </div>

        {/* Card 3 */}
        <div className="p-6 bg-card backdrop-blur-sm rounded-xl border border-border">
          <Sparkles className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">
            Role-Based Access
          </h3>
          <p className="text-muted-foreground text-sm">
            Customized dashboards and features based on your role and permissions.
          </p>
        </div>
      </div>
    </div>
  );
}