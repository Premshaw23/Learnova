"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import ComplaintsTable from "@/components/ComplaintsTable";
import ComplaintForm from "@/components/ComplaintForm";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import DarkVeil from "@/components/ui-block/DarkVeil";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Shield,
  User,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Reveal = ({ children, className = "", delay = 0, y = 20 }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.1 }}
    transition={{ duration: 0.45, delay, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 shadow-xl backdrop-blur-xl transition-all duration-300">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 font-bold">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950 dark:text-slate-50 leading-none">
            {value}
          </p>
        </div>
        <div
          className="p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 shadow-xs"
          style={{ color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ComplaintDetailModal({ complaint, onClose }) {
  if (!complaint) return null;
  const priorityColor = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg relative z-10"
        >
          <Card className="bg-white/95 dark:bg-slate-950/90 border border-white/10 dark:border-slate-700 shadow-2xl backdrop-blur-xl p-2">
            <CardHeader className="relative pb-2">
              <button
                onClick={onClose}
                className="absolute top-2 right-2 p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 text-slate-500 transition cursor-pointer"
               aria-label="Action button">
                <X size={14} />
              </button>
              <p className="text-xs uppercase tracking-[0.3em] text-accent font-mono font-bold">
                {complaint.id}
              </p>
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 mt-1">
                {complaint.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">
                  Issue Description
                </p>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {complaint.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-200 dark:border-slate-800/60 pt-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">
                    Student Name
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 mt-1">
                    {complaint.student}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">
                    Roll Number
                  </p>
                  <p className="font-mono text-xs text-slate-900 dark:text-slate-200 mt-1">
                    {complaint.roll}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">
                    Department
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 mt-1">
                    {complaint.department}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400 font-semibold">
                    Category
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-200 mt-1">
                    {complaint.category}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-4">
                  Status Pipeline Tracker
                </p>
                <div className="flex items-center justify-between relative px-2">
                  <div className="absolute top-2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                  <div
                    className="absolute top-2 left-0 h-0.5 bg-slate-900 dark:bg-indigo-500 z-0 transition-all duration-500"
                    style={{
                      width: complaint.status === "Resolved" ? "100%" : "35%",
                    }}
                  />
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                      ✓
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Filed
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold ${complaint.status !== "Pending" ? "bg-slate-900 dark:bg-indigo-500" : "bg-amber-500"}`}
                    >
                      {complaint.status !== "Pending" ? "✓" : "⏳"}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Review
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${complaint.status === "Resolved" ? "bg-emerald-500 text-white" : complaint.status === "Not Resolved" ? "bg-red-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-transparent"}`}
                    >
                      {complaint.status === "Resolved"
                        ? "✓"
                        : complaint.status === "Not Resolved"
                          ? "✕"
                          : "○"}
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Resolved
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function AnalyticsSection({ complaints }) {
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const notResolved = complaints.filter(
    (c) => c.status === "Not Resolved"
  ).length;

  const categoryMap = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));
  const PIE_COLORS = ["#a855f7", "#3b82f6", "#10b981", "#ec4899"];

  const barData = [
    {
      name: "High",
      count: complaints.filter((c) => c.priority === "High").length,
    },
    {
      name: "Medium",
      count: complaints.filter((c) => c.priority === "Medium").length,
    },
    {
      name: "Low",
      count: complaints.filter((c) => c.priority === "Low").length,
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets"
          value={total}
          color="#3b82f6"
          icon={FileText}
        />
        <StatCard
          label="Pending Review"
          value={pending}
          color="#f59e0b"
          icon={Clock}
        />
        <StatCard
          label="Resolved"
          value={resolved}
          color="#10b981"
          icon={CheckCircle}
        />
        <StatCard
          label="Not Resolved"
          value={notResolved}
          color="#ef4444"
          icon={AlertTriangle}
        />
      </div>

      {complaints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800 p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400 font-bold">
              Distribution
            </p>
            <CardTitle className="text-lg font-semibold text-slate-950 dark:text-slate-50 mt-1 mb-4">
              Complaints by Category
            </CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  className="text-xs font-semibold fill-slate-700 dark:fill-slate-300"
                />
                {/* HOVER TOOLTIP TEXT COLOR REPAIR PIE */}
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800 p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400 font-bold">
              Metrics
            </p>
            <CardTitle className="text-lg font-semibold text-slate-950 dark:text-slate-50 mt-1 mb-4">
              Complaints by Priority
            </CardTitle>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={32}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  className="fill-slate-600 dark:fill-slate-400"
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  className="fill-slate-600 dark:fill-slate-400"
                />
                {/* HOVER TOOLTIP TEXT COLOR REPAIR BAR */}
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    borderRadius: "12px",
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "8px 12px",
                  }}
                  itemStyle={{
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  labelStyle={{ color: "#94a3b8", fontWeight: "700" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.name === "High"
                          ? "#ef4444"
                          : entry.name === "Medium"
                            ? "#f97316"
                            : "#10b981"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const { user, loading: authLoading } = useAuthContext();

  const [complaints, setComplaints] = useState([
    {
      id: "CMP-001",
      student: "Rahul Sharma",
      roll: "22CS101",
      department: "Computer Engineering",
      title: "Attendance not updated",
      category: "Academic",
      priority: "High",
      status: "Pending",
      date: "Aug 12, 2026",
      description:
        "My internal laboratory class attendance fields from June are missing in the database logs.",
    },
    {
      id: "CMP-002",
      student: "Aman Verma",
      roll: "22CS109",
      department: "IT",
      title: "Portal not loading",
      category: "Technical",
      priority: "Medium",
      status: "Resolved",
      date: "Aug 11, 2026",
      description:
        "Encountering timeout errors when submitting large assignments via campus Wi-Fi networks.",
    },
    {
      id: "CMP-003",
      student: "Priya Singh",
      roll: "22CS111",
      department: "ENTC",
      title: "Hostel water issue",
      category: "Hostel",
      priority: "Low",
      status: "Not Resolved",
      date: "Aug 10, 2026",
      description:
        "Low water pressure on the third floor of Block B requires maintenance review.",
    },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  if (authLoading) return null;

  const handleAddComplaint = (newComplaint) => {
    setComplaints((prev) => {
      const formattedId = `CMP-${String(prev.length + 1).padStart(3, "0")}`;
      const formattedDate = new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return [
        ...prev,
        {
          ...newComplaint,
          id: formattedId,
          status: "Pending",
          date: formattedDate,
        },
      ];
    });
    setShowForm(false);
    toast.success("Complaint filed successfully!");
  };

  return (
    <>
      {/* PERFECT CHROMATIC CANVAS WRAPPER ARCHITECTURE SYNCED WITH WELLNESS/FOCUS SUITE */}
      <div className="fixed inset-0 -z-10 bg-slate-50 dark:bg-[#070913]">
        <DarkVeil />
        <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div
          className="absolute bottom-[100px] right-[-100px] w-[600px] h-[600px] bg-blue-500/10 dark:bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="min-h-screen relative z-50">
        <Navbar />
        <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {loading ? (
            <CardListSkeleton count={3} variant="table" />
          ) : showForm ? (
            <ComplaintForm
              onClose={() => setShowForm(false)}
              onSubmitComplaint={handleAddComplaint}
            />
          ) : (
            <Reveal>
              <AnalyticsSection complaints={complaints} />
              <ComplaintsTable
                complaints={complaints}
                onRaiseComplaint={() => setShowForm(true)}
                onRowClick={setSelectedComplaint}
              />
            </Reveal>
          )}
        </div>
      </div>
      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </>
  );
}
