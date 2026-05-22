"use client";
import { Sparkles, Shield, Zap } from "lucide-react";
import { ROLE_CONFIG } from "@/constants/userRoles";

export default function RoleSelection({ onRoleSelect }) {
  // Keyboard handler — Enter ya Space press hone pe role select hoga
  const handleKeyDown = (e, role) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault(); // Page scroll rokne ke liye Space key pe
      onRoleSelect(role);
    }
  };

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          <h1 className="text-4xl font-bold">Choose Your Role</h1>
        </div>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Select your role to access the appropriate dashboard and features
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const IconComponent = config.icon;
          return (
            <button
              key={role}
              onClick={() => onRoleSelect(role)}
              aria-label={`Select ${config.title} role`}
              onKeyDown={(e) => handleKeyDown(e, role)} // ✅ NEW — keyboard support
              className="group p-4 bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900" // ✅ NEW — focus ring
            >
              <div
                className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${config.color} p-4 group-hover:shadow-lg transition-all duration-300`}
              >
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl text-center mx-auto font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                {config.title}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors">
                {config.description}
              </p>
              <div
                className={`mt-6 py-2 px-4 rounded-full bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              >
                <span className="text-white text-sm font-medium">
                  Select Role
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <Shield className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h4 className="font-semibold text-white mb-2">Secure Access</h4>
          <p className="text-gray-400 text-sm">
            Role-based permissions and security
          </p>
        </div>
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <Zap className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h4 className="font-semibold text-white mb-2">Real-time Sync</h4>
          <p className="text-gray-400 text-sm">
            Instant updates across all devices
          </p>
        </div>
        <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/30">
          <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h4 className="font-semibold text-white mb-2">Custom Dashboard</h4>
          <p className="text-gray-400 text-sm">
            Tailored experience for your role
          </p>
        </div>
      </div>
    </div>
  );
}
