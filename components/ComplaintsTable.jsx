"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from "lucide-react";

export default function ComplaintsTable({
  complaints = [],
  onRaiseComplaint,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch =
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.student?.toLowerCase().includes(search.toLowerCase()) ||
        c.id?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All"
          ? true
          : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, statusFilter]);

  return (
    <div className="space-y-6">

      {/* TOP CARD */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 p-8 text-white shadow-2xl">

        <div className="flex flex-col lg:flex-row gap-6 justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Student Complaints Dashboard
            </h1>

            <p className="text-purple-100 mt-2">
              Track and manage student complaints
            </p>
          </div>

          <button
            onClick={onRaiseComplaint}
            className="px-6 py-3 rounded-2xl bg-white text-purple-700 font-semibold hover:scale-105 transition-all duration-300 shadow-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Raise Complaint
          </button>

        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-4 flex flex-col lg:flex-row gap-4 justify-between">

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-background w-full lg:max-w-md">

          <Search className="w-4 h-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-border bg-background w-full lg:w-60">

          <Filter className="w-4 h-4 text-muted-foreground" />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent outline-none w-full"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Not Resolved">Not Resolved</option>
          </select>
        </div>

      </div>

      {/* TABLE */}
      <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-xl">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-left">

                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Roll</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>

              </tr>
            </thead>

            <tbody>

              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border hover:bg-purple-500/5 transition-all"
                  >

                    <td className="px-6 py-5 font-semibold text-purple-500">
                      {c.id}
                    </td>

                    <td className="px-6 py-5">
                      {c.student}
                    </td>

                    <td className="px-6 py-5">
                      {c.roll}
                    </td>

                    <td className="px-6 py-5">
                      {c.department}
                    </td>

                    <td className="px-6 py-5">
                      {c.title}
                    </td>

                    <td className="px-6 py-5">
                      {c.category}
                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          c.priority === "High"
                            ? "bg-red-500/10 text-red-500"
                            : c.priority === "Medium"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {c.priority}
                      </span>

                    </td>

                    <td className="px-6 py-5">

                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          c.status === "Resolved"
                            ? "bg-green-500/10 text-green-500"
                            : c.status === "Pending"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >

                        {c.status === "Resolved" ? (
                          <CheckCircle2 size={14} />
                        ) : c.status === "Pending" ? (
                          <Clock3 size={14} />
                        ) : (
                          <AlertCircle size={14} />
                        )}

                        {c.status}
                      </span>

                    </td>

                    <td className="px-6 py-5">
                      {c.date}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-10 text-muted-foreground"
                  >
                    No complaints found
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}