"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import ComplaintsTable from "@/components/ComplaintsTable";
import ComplaintForm from "@/components/ComplaintForm";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import CardListSkeleton from "@/components/ui/CardListSkeleton";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div
      style={{ borderTop: `3px solid ${color}` }}
      className="bg-card rounded-xl p-5 flex items-center gap-4 shadow-sm"
    >
      <div
        className="text-2xl w-11 h-11 rounded-lg flex items-center justify-center"
        style={{ background: `${color}22` }}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
          {label}
        </p>
        <p className="text-3xl font-bold mt-0.5" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function ComplaintDetailModal({ complaint, onClose }) {
  if (!complaint) return null;

  const priorityColor = {
    High: "#ef4444",
    Medium: "#f97316",
    Low: "#22c55e",
  };
  const statusColor = {
    Pending: "#eab308",
    Resolved: "#22c55e",
    "Not Resolved": "#ef4444",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-1">{complaint.title}</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Complaint ID:{" "}
          <span className="font-mono text-primary">{complaint.id}</span>
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Student</p>
            <p className="font-semibold mt-0.5">{complaint.student}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Roll No</p>
            <p className="font-semibold mt-0.5">{complaint.roll}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Department</p>
            <p className="font-semibold mt-0.5">{complaint.department}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Category</p>
            <p className="font-semibold mt-0.5">{complaint.category}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Priority</p>
            <span
              className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: priorityColor[complaint.priority] || "#888" }}
            >
              {complaint.priority}
            </span>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Status</p>
            <span
              className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: statusColor[complaint.status] || "#888" }}
            >
              {complaint.status}
            </span>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground text-xs uppercase tracking-wide">Date</p>
            <p className="font-semibold mt-0.5">{complaint.date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Section ────────────────────────────────────────────────────────
function AnalyticsSection({ complaints }) {
  const total = complaints.length;
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const resolved = complaints.filter((c) => c.status === "Resolved").length;
  const notResolved = complaints.filter((c) => c.status === "Not Resolved").length;

  const categoryMap = {};
  complaints.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const PIE_COLORS = ["#6366f1", "#f97316", "#22c55e", "#eab308", "#ec4899", "#14b8a6"];

  const barData = [
    { name: "High", count: complaints.filter((c) => c.priority === "High").length },
    { name: "Medium", count: complaints.filter((c) => c.priority === "Medium").length },
    { name: "Low", count: complaints.filter((c) => c.priority === "Low").length },
  ];
  const BAR_COLORS = { High: "#ef4444", Medium: "#f97316", Low: "#22c55e" };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={total} color="#6366f1" icon="📋" />
        <StatCard label="Pending" value={pending} color="#eab308" icon="⏳" />
        <StatCard label="Resolved" value={resolved} color="#22c55e" icon="✅" />
        <StatCard label="Not Resolved" value={notResolved} color="#ef4444" icon="❌" />
      </div>

      {complaints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              📊 Complaints by Category
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              📈 Complaints by Priority
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={BAR_COLORS[entry.name] || "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComplaintsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();

  const [complaints, setComplaints] = useState([
    {
      id: "CMP-101",
      student: "Rahul Sharma",
      roll: "22CS101",
      department: "Computer Engineering",
      title: "Attendance not updated",
      category: "Academic",
      priority: "High",
      status: "Pending",
      date: "12 Aug 2026",
    },
    {
      id: "CMP-102",
      student: "Aman Verma",
      roll: "22CS109",
      department: "IT",
      title: "Portal not loading",
      category: "Technical",
      priority: "Medium",
      status: "Resolved",
      date: "11 Aug 2026",
    },
    {
      id: "CMP-103",
      student: "Priya Singh",
      roll: "22CS111",
      department: "ENTC",
      title: "Hostel water issue",
      category: "Hostel",
      priority: "Low",
      status: "Not Resolved",
      date: "10 Aug 2026",
    },
  ]);

  // ── Auth check temporarily disabled for local testing ──
  // useEffect(() => {
  //   if (!authLoading && !user) {
  //     router.push("/auth");
  //   }
  // }, [authLoading, user, router]);

  if (authLoading) return null;

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleAddComplaint = (newComplaint) => {
    setComplaints((prev) => [
      {
        ...newComplaint,
        id: `CMP-${prev.length + 104}`,
        status: "Pending",
        date: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);
    setShowForm(false);
    toast.success("Complaint submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="pt-24 px-4 md:px-8 lg:px-10 pb-10">
        {loading ? (
          <CardListSkeleton count={3} variant="table" />
        ) : showForm ? (
          <ComplaintForm
            onClose={() => setShowForm(false)}
            onSubmitComplaint={handleAddComplaint}
          />
        ) : (
          <>
            <AnalyticsSection complaints={complaints} />
            <ComplaintsTable
              complaints={complaints}
              onRaiseComplaint={() => setShowForm(true)}
              onRowClick={(complaint) => setSelectedComplaint(complaint)}
            />
          </>
        )}
      </div>

      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
      />
    </div>
  );
}