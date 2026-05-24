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
    <div className="relative max-w-5xl mx-auto text-center px-4 py-8 overflow-hidden">
      {/* Ambient Background Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-indigo-600/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-3/4 left-1/4 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-purple-500/10 blur-[90px] pointer-events-none" />

      <div className="mb-12 relative z-10">
        <div className="inline-flex items-center gap-2.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
          <Sparkles className="w-8 h-8 text-indigo-400" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">Choose Your Role</h1>
        </div>
        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Select your portal to unlock your customized Learnova dashboard and features
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => {
          const IconComponent = config.icon;
          
          // Custom glowing borders and shadows matching each role's color scheme
          const shadowGlow = {
            student: "hover:shadow-blue-500/10 hover:border-blue-500/30",
            teacher: "hover:shadow-green-500/10 hover:border-green-500/30",
            institute: "hover:shadow-purple-500/10 hover:border-purple-500/30",
            admin: "hover:shadow-orange-500/10 hover:border-orange-500/30",
          }[role] || "hover:shadow-indigo-500/10 hover:border-indigo-500/30";

          return (
            <button
              key={role}
              onClick={() => onRoleSelect(role)}
              aria-label={`Select ${config.title} role`}
              onKeyDown={(e) => handleKeyDown(e, role)} // Keyboard support
              className={`group p-6 bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/10 ${shadowGlow} transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.03] active:scale-[0.98] text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer shadow-xl w-full max-w-[280px] sm:max-w-none mx-auto`}
            >
              <div
                className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${config.color} p-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <IconComponent className="w-8 h-8 text-white animate-pulse" />
              </div>
              <h3 className="text-xl text-center mx-auto font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                {config.title}
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors">
                {config.description}
              </p>
              <div
                className={`mt-6 py-2.5 px-4 rounded-xl bg-gradient-to-r ${config.color} opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-300 shadow-md`}
              >
                <span className="text-white text-sm font-semibold">
                  Select Role
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Features Preview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
          <Shield className="w-10 h-10 text-indigo-400 mx-auto mb-4" />
          <h4 className="font-bold text-white mb-2 text-base">Secure Access</h4>
          <p className="text-slate-100 text-sm leading-relaxed">
            Role-based permissions and high-security compliance standards
          </p>
        </div>
        <div className="p-6 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
          <Zap className="w-10 h-10 text-purple-400 mx-auto mb-4" />
          <h4 className="font-bold text-white mb-2 text-base">Real-time Sync</h4>
          <p className="text-slate-100 text-sm leading-relaxed">
            Instant database updates synced seamlessly across all devices
          </p>
        </div>
        <div className="p-6 sm:col-span-2 lg:col-span-1 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300">
          <Sparkles className="w-10 h-10 text-pink-400 mx-auto mb-4" />
          <h4 className="font-bold text-white mb-2 text-base">Custom Dashboard</h4>
          <p className="text-slate-100 text-sm leading-relaxed">
            Tailored layouts built for your specialized platform activities
          </p>
        </div>
      </div>
    </div>
  );
}
