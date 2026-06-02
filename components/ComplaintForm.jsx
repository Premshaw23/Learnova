"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";

export default function ComplaintForm({
  onClose,
  onSubmitComplaint,
}) {

  const { user } = useAuthContext();

  const [form, setForm] = useState({
    student: "",
    roll: "",
    department: "",
    title: "",
    category: "Academic",
    priority: "Medium",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmitComplaint({
  ...form,
  email: user?.email || "",
});

    setForm({
      student: "",
      roll: "",
      department: "",
      title: "",
      category: "Academic",
      priority: "Medium",
      description: "",
    });
  };

  return (
    <div className="max-w-5xl mx-auto">

      <div className="rounded-3xl border border-border bg-card/70 backdrop-blur-xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 p-8 text-white">

          <button
            onClick={onClose}
            className="flex items-center gap-2 mb-6 hover:opacity-80 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <h1 className="text-3xl font-bold">
            Raise New Complaint
          </h1>

          <p className="text-purple-100 mt-2">
            Submit your issue to the administration
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >

          <input
            required
            id="student-name"
            maxLength={100}
            placeholder="Student Name"
            value={form.student}
            onChange={(e) =>
              setForm({ ...form, student: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <input
            required
            id="roll-number"
            maxLength={20}
            placeholder="Roll Number"
            value={form.roll}
            onChange={(e) =>
              setForm({ ...form, roll: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <input
            required
            id="department"
            maxLength={80}
            placeholder="Department"
            value={form.department}
            onChange={(e) =>
              setForm({ ...form, department: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          >
            <option>Academic</option>
            <option>Technical</option>
            <option>Hostel</option>
            <option>Other</option>
          </select>

          <input
            required
            id="complaint-title"
            maxLength={150}
            placeholder="Complaint Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            className="md:col-span-2 px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value })
            }
            className="md:col-span-2 px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>

          <textarea
            rows={6}
            required
            id="description"
            maxLength={1000}
            placeholder="Describe your issue..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="md:col-span-2 px-4 py-3 rounded-2xl border border-border bg-background outline-none resize-none"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Logged in Email
            </label>

            <input
              type="email"
              value={user?.email || ""}
              readOnly
              className="w-full px-4 py-3 rounded-2xl border border-border bg-muted cursor-not-allowed outline-none"
            />

            <p className="text-xs text-muted-foreground mt-2">
              Complaint will be submitted using your authenticated account.
            </p>
          </div>

          <button
            type="submit"
            className="md:col-span-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white font-semibold hover:scale-[1.01] transition-all shadow-xl"
          >
            Submit Complaint
          </button>

        </form>
      </div>
    </div>
  );
}