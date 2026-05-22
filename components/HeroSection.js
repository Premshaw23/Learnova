"use client";
import { Sparkles, Shield, Zap } from "lucide-react";

export default function HeroSection() {
  return (
    <div>
      <div className="text-center lg:text-left mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold">Premium Access</h1>
        </div>
        <p className="text-gray-300 text-lg max-w-2xl">
          Join thousands of professionals who trust our platform for secure
          attendance management
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6 mb-8">
        <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Shield className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">Enterprise Security</h3>
          <p className="text-gray-300 text-sm">
            Bank-level encryption and security protocols to protect your data
          </p>
        </div>
        <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Zap className="w-12 h-12 text-purple-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">Lightning Fast</h3>
          <p className="text-gray-300 text-sm">
            Instant sync across all your devices with real-time updates
          </p>
        </div>
        <div className="p-6 bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50">
          <Sparkles className="w-12 h-12 text-indigo-400 mb-4" />
          <h3 className="font-semibold text-white mb-2">Role-Based Access</h3>
          <p className="text-gray-300 text-sm">
            Customized dashboards and features based on your role and
            permissions
          </p>
        </div>
      </div>
    </div>
  );
}
