"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Shield, Upload, Check } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ComplaintForm({ onClose, onSubmitComplaint }) {
  const { user } = useAuthContext();
  const fileInputRef = useRef(null);

  // STUDENT INPUT UPGRADE: Editable name fields linked to reactive auth layouts
  const [form, setForm] = useState({
    studentName: "",
    rollNumber: "",
    department: "",
    title: "",
    category: "Academic",
    priority: "Medium",
    description: "",
  });
  
  const MAX_LENGTH = 100;
  const getCounterColor = (length) => {
    if (length >= MAX_LENGTH) return "text-red-500 font-semibold";     // error-red
    if (length >= MAX_LENGTH - 15) return "text-amber-500 font-medium"; // warning-amber
    return "text-neutral-400";                                         // default subtle
  };

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        studentName: user.displayName || prev.studentName,
      }));
    }
  }, [user]);

  const handleDrag = (e) => {
    e.preventDefault();
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachment(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.description || (!isAnonymous && !form.studentName))
      return;
    onSubmitComplaint({
      title: form.title,
      category: form.category,
      priority: form.priority,
      description: form.description,
      student: isAnonymous ? "Anonymous Student" : form.studentName,
      roll: isAnonymous ? "N/A" : form.rollNumber || "Not Specified",
      department: isAnonymous ? "N/A" : form.department || "Not Specified",
      isAnonymous: isAnonymous,
      attachmentName: attachment ? attachment.name : null,
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="bg-white/85 dark:bg-slate-950/40 border border-white/10 dark:border-slate-800/80 rounded-[2rem] overflow-hidden shadow-2xl p-0 backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* SIDE PANEL INFOBAR */}
          <div className="lg:col-span-4 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 p-6 md:p-8 text-white flex flex-col justify-between">
            <div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 mb-8 text-xs font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-2xl transition border border-white/10 cursor-pointer"
               aria-label="Action button">
                <ArrowLeft size={14} /> Back
              </button>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200 font-semibold">
                Guidelines
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">
                Filing a Complaint
              </h2>
              <p className="text-indigo-100 text-xs leading-6 mt-3">
                Please enter your details below. Provide a clear description of
                your classroom, course, or hostel issue so administration can
                review it promptly.
              </p>
            </div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-indigo-200/50 pt-4 border-t border-white/10 mt-8">
              Learnova Student Suite
            </div>
          </div>

          {/* STUDENT DATA FORMS CAPTURE */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-8 p-6 md:p-8 space-y-5 text-slate-900 dark:text-slate-100"
          >
            {/* DYNAMIC METADATA CREDENTIAL CHIPS */}
            <AnimatePresence>
              {!isAnonymous && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200/50 dark:border-slate-800/60 pb-5"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required={!isAnonymous}
                      placeholder="Enter your name..."
                      value={form.studentName}
                      onChange={(e) =>
                        setForm({ ...form, studentName: e.target.value })
                      }
                      className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-indigo-500 transition text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 22CS101"
                      value={form.rollNumber}
                      onChange={(e) =>
                        setForm({ ...form, rollNumber: e.target.value })
                      }
                      className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-indigo-500 transition text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSE / IT"
                      value={form.department}
                      onChange={(e) =>
                        setForm({ ...form, department: e.target.value })
                      }
                      className="px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-indigo-500 transition text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                  Complaint Title
                </label>
                <input
                  required
                  placeholder="What issue are you facing?..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 outline-none focus:border-indigo-500 transition text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 outline-none text-slate-700 dark:text-slate-300 cursor-pointer [&>option]:bg-white dark:[&>option]:bg-slate-950"
                >
                  <option>Academic</option>
                  <option>Technical</option>
                  <option>Hostel</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {["Low", "Medium", "High"].map((p) => {
                  const isSelected = form.priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`border px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/10 text-slate-400 opacity-60 hover:opacity-100"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                Issue Description
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide accurate details about the problem..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="px-4 py-3 text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/50 outline-none focus:border-indigo-500 transition resize-none text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase font-bold tracking-[0.15em] text-slate-400">
                Supporting Files
              </label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-slate-200 dark:border-slate-700 bg-slate-50/10 dark:bg-slate-900/10 hover:border-slate-400"}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && setAttachment(e.target.files[0])
                  }
                  accept="image/*,.pdf"
                />
                <Upload size={16} className="text-slate-400 mb-1" />
                <p className="text-xs text-slate-400">
                  {attachment ? (
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono font-medium flex items-center gap-1">
                      <Check size={12} /> {attachment.name}
                    </span>
                  ) : (
                    "Drag files here, or click to choose from folder"
                  )}
                </p>
              </div>
            </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >

          <input
            required
            placeholder="Student Name"
            value={form.student}
            onChange={(e) =>
              setForm({ ...form, student: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <input
            required
            placeholder="Roll Number"
            value={form.roll}
            onChange={(e) =>
              setForm({ ...form, roll: e.target.value })
            }
            className="px-4 py-3 rounded-2xl border border-border bg-background outline-none"
          />

          <input
            required
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

          {/* DYNAMIC TITLE FIELD WITH CHARACTER COUNTER */}
          <div className="md:col-span-2 relative flex items-center">
            <input
              required
              placeholder="Complaint Title"
              value={form.title}
              maxLength={MAX_LENGTH}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
            }
            className="w-full px-4 py-3 pr-20 rounded-2xl border border-border bg-background outline-none"
         />
          <span className={`absolute right-4 text-xs select-none ${getCounterColor(form.title.length)}`}>
            {form.title.length}/{MAX_LENGTH}
          </span>
        </div>

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
            placeholder="Describe your issue..."
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="md:col-span-2 px-4 py-3 rounded-2xl border border-border bg-background outline-none resize-none"
          />

          <button
            type="submit"
            className="md:col-span-2 py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-blue-600 text-white font-semibold hover:scale-[1.01] transition-all shadow-xl"
          >
            Submit Complaint
          </button>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10">
              <div>
                <span className="text-xs font-bold block text-slate-700 dark:text-slate-300">
                  Submit Anonymously
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Hide your name and student ID from the admin review panel.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-10 h-5.5 rounded-full p-0.5 flex items-center transition-colors cursor-pointer ${isAnonymous ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"}`}
              >
                <motion.div
                  layout
                  animate={{ x: isAnonymous ? 18 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="bg-white dark:bg-slate-900 w-4 h-4 rounded-full shadow-sm"
                />
              </button>
            </div>

            <Button
              type="submit"
              className="w-full py-4 rounded-2xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-sm font-semibold shadow-md cursor-pointer"
            >
              Submit Complaint
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
