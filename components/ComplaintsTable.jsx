"use client";

import { useMemo, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ComplaintsTable({
  complaints = [],
  onRaiseComplaint,
  onRowClick,
}) {
  const { user } = useAuthContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.toLowerCase().includes(search.toLowerCase()) ||
        c.id?.toLowerCase().includes(search.toLowerCase());
      return (
        matchesSearch && (statusFilter === "All" || c.status === statusFilter)
      );
    });
  }, [complaints, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* OVERHAULED INTEGRATED GLASS HERO CARD */}
      <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-slate-400">
              Support Center
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              Complaints Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              File a classroom, portal, or hostel issue and monitor its
              resolution trajectory fields.
            </p>
          </div>
          <Button
            onClick={onRaiseComplaint}
            className="rounded-3xl px-6 py-5 font-semibold text-sm bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 transition shadow-md hover:opacity-90 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" /> Raise Complaint
          </Button>
        </div>
      </Card>

      {/* ACTION FILTERS GLASS CONSOLE */}
      <div className="rounded-3xl border border-white/10 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/40 p-4 flex flex-col md:flex-row gap-4 justify-between shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, keyword, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 w-full md:w-60">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-slate-700 dark:text-slate-300 outline-none w-full text-sm cursor-pointer [&>option]:bg-white dark:[&>option]:bg-slate-950"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Not Resolved">Not Resolved</option>
          </select>
        </div>
      </div>

      {/* DATA RECORDS LEDGER GRID */}
      <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Complaint ID</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4 text-center">Priority</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right pr-8">Date</th>
              </tr>
            </thead>

            <motion.tbody
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
            >
              {filteredComplaints.map((c) => (
                <motion.tr
                  key={c.id}
                  onClick={() => onRowClick && onRowClick(c)}
                  variants={{
                    hidden: { opacity: 0, y: 4 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  className="border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 transition-colors cursor-pointer text-sm"
                >
                  <td className="px-6 py-5 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {c.id}
                  </td>
                  <td className="px-6 py-5 font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate">
                    {c.title}
                  </td>
                  <td className="px-6 py-5 text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      {c.isAnonymous && (
                        <Shield size={12} className="text-purple-500" />
                      )}
                      <span
                        className={
                          c.isAnonymous ? "text-purple-500 font-medium" : ""
                        }
                      >
                        {c.student}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {c.roll}
                  </td>
                  <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-xs">
                    {c.department}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                        c.priority === "High"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : c.priority === "Medium"
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            : "bg-green-500/10 text-green-500 border-green-500/20"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        c.status === "Resolved"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : c.status === "Pending"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-500"
                      }`}
                    >
                      {c.status === "Resolved" ? (
                        <CheckCircle2 size={12} />
                      ) : c.status === "Pending" ? (
                        <Clock3 size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right pr-8 font-medium text-xs text-slate-400">
                    {c.date}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
